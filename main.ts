import {
	App,
	ObsidianProtocolHandler,
	Plugin,
	PluginSettingTab,
	requestUrl,
	Setting,
	SuggestModal,
	type TFile,
} from "obsidian";

interface HerePluginSettings {
	googleMapsApiKey: null | string;
}

export interface GooglePlacesAPIResult {
	name: string;
	types: string[];
	vicinity: string;
	geometry: {
		location: {
			lat: number;
			lng: number;
		};
	};
	place_id: string;
}

export interface GoogleGeocodingAPIResponse {
	status:
		| "OK"
		| "ZERO_RESULTS"
		| "OVER_DAILY_LIMIT"
		| "OVER_QUERY_LIMIT"
		| "REQUEST_DENIED"
		| "INVALID_REQUEST"
		| "UNKNOWN_ERROR";
	results: GooglePlacesAPIResult[];
}

function pickGoogleProperties(result: GooglePlacesAPIResult) {
	const { lat, lng } = result.geometry.location;
	return {
		name: result.name,
		address: result.vicinity,
		place_id: result.place_id,
		// Obsidian does not support numeric arrays
		location: [lat, lng].map((l) => l.toString()),
		lat,
		lng,
		map_view: `[](geo:${lat},${lng})`,
	};
}

type RefinedGoogleProperties = ReturnType<typeof pickGoogleProperties>;

type NearbyResult =
	| ["file", number, TFile]
	| ["new", number, RefinedGoogleProperties];

function getLatLon(input: unknown) {
	if (Array.isArray(input) && input.length === 2) {
		if (typeof input[0] === "number" && typeof input[1] === "number") {
			return input;
		}
		const ll = input.map((l) => Number.parseFloat(l));
		if (ll.some((l) => Number.isNaN(l))) return null;
		return ll;
	}
}

const DEFAULT_SETTINGS: HerePluginSettings = {
	googleMapsApiKey: null,
};

export default class HerePlugin extends Plugin {
	settings: HerePluginSettings;

	onUri: ObsidianProtocolHandler = (params) => {
		const here: [number, number] = [
			Number.parseFloat(params.lat),
			Number.parseFloat(params.lon),
		];
		if (here.some((l) => Number.isNaN(l))) return;
		this.nearbyNotes(here);
	};

	async getResultsFromGoogleMaps(here: C): Promise<NearbyResult[]> {
		if (!this.settings.googleMapsApiKey) return [];

		const response = await requestUrl({
			url: `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${here.join(",")}&key=${this.settings.googleMapsApiKey}&radius=800`,
			throw: false,
		});

		if (response.status !== 200) {
			throw new Error(`Server responded with ${response.status}`);
		}

		const { status, results } = response.json as GoogleGeocodingAPIResponse;

		console.log(status, results);

		switch (status) {
			case "OK":
				break;
			case "ZERO_RESULTS":
				throw new Error("No results found");
			case "OVER_DAILY_LIMIT":
				throw new Error("Over daily limit");
			case "OVER_QUERY_LIMIT":
				throw new Error("Over query limit");
			case "REQUEST_DENIED":
				throw new Error("Request denied (invalid API key?)");
			default:
				throw new Error("Unknown API response");
		}

		return results.map((result) => {
			console.log(result);
			return [
				"new",
				haversine(here, [
					result.geometry.location.lat,
					result.geometry.location.lng,
				]),
				pickGoogleProperties(result),
			];
		});
	}

	async nearbyNotes(here: C) {
		const { vault, metadataCache } = this.app;
		let results: NearbyResult[] = [];
		for (const file of vault.getMarkdownFiles()) {
			const cache = metadataCache.getFileCache(file);
			const loc = cache?.frontmatter?.location;
			const ll = getLatLon(loc);
			if (ll) {
				results.push(["file", haversine(here, loc), file]);
			}
		}

		const newResults = await this.getResultsFromGoogleMaps(here);
		results = results.concat(newResults);
		results.sort((a, b) => a[1] - b[1]).slice(0, 10);

		new NearbyResultsModal(this, results).open();
	}

	async onload() {
		await this.loadSettings();

		this.registerObsidianProtocolHandler("here", this.onUri);

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "nearby-notes",
			name: "Nearby notes debugging",
			callback: () => {
				this.nearbyNotes([40.68, -73.98]);
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new HereSettingTab(this.app, this));
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

function toRad(num: number) {
	return (num * Math.PI) / 180;
}

type C = [number, number];

/** Distance between lat, lon coords in miles */
function haversine(start: C, end: C) {
	// Miles
	const R = 3960;
	const dLat = toRad(end[0] - start[0]);
	const dLon = toRad(end[1] - start[1]);
	const lat1 = toRad(start[0]);
	const lat2 = toRad(end[0]);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
}

export class NearbyResultsModal extends SuggestModal<NearbyResult> {
	plugin: HerePlugin;
	results: NearbyResult[];

	constructor(plugin: HerePlugin, results: NearbyResult[]) {
		super(plugin.app);
		this.plugin = plugin;
		this.results = results;
		this.setPlaceholder("Select result");
	}

	getSuggestions(query: string) {
		return this.results.filter((result) =>
			result[2].name.toLowerCase().includes(query.toLowerCase()),
		);
	}

	async onChooseSuggestion(result: NearbyResult) {
		switch (result[0]) {
			case "file": {
				const file = result[2];
				const leaf = this.app.workspace.getLeaf(false);
				await leaf.openFile(file);
				break;
			}
			case "new": {
				const info = result[2];
				const file = await this.app.vault.create(`${info.name}.md`, "");
				const leaf = this.app.workspace.getLeaf(false);
				this.app.fileManager.processFrontMatter(file, (frontmatter) => {
					Object.assign(frontmatter, info);
				});
				await leaf.openFile(file);
				break;
			}
		}
	}

	renderSuggestion([type, dist, info]: NearbyResult, el: HTMLElement) {
		// TODO: improve the styling here
		switch (type) {
			case "file": {
				el.createEl("div", {
					text: `${dist.toFixed(1)}mi | ${info.path}`,
				});
				break;
			}
			case "new": {
				el.createEl("div", {
					text: `${dist.toFixed(1)}mi | ${info.name} (create)`,
				});
				break;
			}
		}
	}
}

class HereSettingTab extends PluginSettingTab {
	plugin: HerePlugin;

	constructor(app: App, plugin: HerePlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl).setName("Google Maps API Key").addText((text) =>
			text
				.setPlaceholder("Enter your secret")
				.setValue(this.plugin.settings.googleMapsApiKey ?? "")
				.onChange(async (value) => {
					this.plugin.settings.googleMapsApiKey = value;
					await this.plugin.saveSettings();
				}),
		);
	}
}
