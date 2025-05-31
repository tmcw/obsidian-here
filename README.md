# Obsidian Here

This is another ingredient of an [Obsidian](https://obsidian.md/) setup that's geospatially
enabled. This plugin lets Obsidian find nearby notes: notes that have a `location` property
with latitude & longitude.

**The catch** is that Obsidian does not [allow Geolocation APIs](https://forum.obsidian.md/t/enable-geolocation-apis-for-mobile-and-desktop/31750/4), so
to get an idea of "here", you need another ingredient. Thankfully, there are ways. See
the `shortcut` directory of this repository for an Apple Shortcut called **Here** which you
can tap and immediately open Obsidian with nearby locations queued up.

Most likely, you're going to use [obsidian-geocoding-properties](https://obsidian.md/plugins?id=geocoding-properties) alongside this plugin: that
lets you add geospatial data to existing notes. And [Leaflet](https://obsidian.md/plugins?id=obsidian-leaflet-plugin) for displaying maps.

## Adding your plugin to the community plugin list

- Check the [plugin guidelines](https://docs.obsidian.md/Plugins/Releasing/Plugin+guidelines).
- Publish an initial version.
- Make sure you have a `README.md` file in the root of your repo.
- Make a pull request at https://github.com/obsidianmd/obsidian-releases to add your plugin.

## API Documentation

See https://github.com/obsidianmd/obsidian-api
