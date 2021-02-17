# HypixelAPITester

An emulator to play with the Hypixel API

# How does this work ? 

This fetches all possible endpoints of the Hypixel API with valid requests, and creates a server serving the data as if you are requesting an endpoint of api.hypixel.net. Of course, the data won't be up to date and will not take into account the uuid etc.,
On github, the data stored in the endpoints server will update every day.

# Use Cases 

- Github Actions can benefit from this : you don't have to put your API Key and you can still test code that is committed / PR'd, all that without worrying about rate limits and stuff.
- Projects in testing : make sure you don't spam the API on accident :)
- Offline access to the API : Even though it is 2021 as this is written, a lot of people don't have access to stable or fast Internet. Testing can often be a pain with slower speeds.
- Archival/Notificational purposes : It will be easy to see what properties have been added/changed/removed in the endpoints so you can adapt your code accordingly ( we know from experience hypixel changes data in the player endpoint every so often )
- etc.,

# CLI

- Commands : 
  1. `npm run update <API_KEY>` :  Updates the stored data in endpoints/ .
  2. `npm run freshupdate <API_KEY> [github URL*] [branch*] [Path*]` : Updates both constants.json ( where endpoints are stored ) as well as all stored data
  3. `npm run updateconstant [github URL] [branch] [Path]` : Updates constants.json 
  4. `npm run partialupdate <API_KEY> [endpoint1] [endpoint2] ... [endpointN]` : Updates all mentioned endpoints. An inexistent endpoint will still be saved.
  5. `npm run purge` : Purges all data stored in endpoints/ . ( Will require you to run an update )
  6. `npm run server [port]` : Runs a server on the precised port ( default 80 ).
* - github URL is the URL to the repo with docs for the hypixel API ( default https://github.com/HypixelDev/PublicAPI ); branch the branch to use ( default `master` ); Path is the Path to documentation ( default `Documentation/methods` )

# API

- Everything is documented with JSdoc.

