# Obsidian Here

This is another ingredient of an [Obsidian](https://obsidian.md/) setup that's geospatially
enabled. This plugin lets Obsidian find nearby notes: notes that have a `location` property
with latitude & longitude.

**The catch** is that Obsidian does not [allow Geolocation APIs](https://forum.obsidian.md/t/enable-geolocation-apis-for-mobile-and-desktop/31750/4), so
to get an idea of "here", you need another ingredient. Thankfully, there are ways. See
the [`shortcut` directory of this repository](https://github.com/tmcw/obsidian-here/tree/main/shortcut) for an Apple Shortcut called **Here** which you
can download, install, tap and immediately open Obsidian with nearby locations queued up.
Something similar should be possible for Linux, Windows, and web users - use the geolocation API,
and open obsidian with this plugin's custom URI:

```
obsidian://here?lat=LATITUDE&lon=LONGITUDE
```

Most likely, you're going to use [obsidian-geocoding-properties](https://obsidian.md/plugins?id=geocoding-properties) alongside this plugin: that
lets you add geospatial data to existing notes. And [Leaflet](https://obsidian.md/plugins?id=obsidian-leaflet-plugin) for displaying maps.

## Google Places

If you open settings and add a Google API key with the Places API enabled, then this plugin
can suggest new places and add new files to your vault when you select them. Note that
the Places API is a paid API and can be expensive, so use at your own risk. If you don't add
an API key, you'll just get existing notes with `location` properties in your search results.

## Very welcome contributions

There's a short but worthwhile TODO list for this project, and if you're interested in contributing,
good places to start could be:

- Support for POI search services other than Google
- A web-based launchpad to open the plugin from so that this doesn't
  rely entirely on Apple Shortcuts
- The ability for this to de-duplicate results between new places suggestions and
  existing notes.
- Maybe a map view in a modal of nearby places with the ability to create new notes
  from there.

## Development

This is nearly the Obsidian template, so you don't need anything special. If you use
[mise](https://mise.jdx.dev/), you can auto-install Node & PNPM. Otherwise, this works
with Node (most recent versions) and PNPM 9 to install dependencies, but if you install
dependencies with NPM, it will probably work too.

To test in development mode, run `npm run dev` or `pnpm dev` to rebuild the source
code and clone this into your `.obsidian/plugins` folder.

## Adding your plugin to the community plugin list

- Check the [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines).
- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at https://github.com/obsidianmd/obsidian-releases to add your plugin.
