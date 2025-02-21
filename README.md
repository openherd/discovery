# discovery

The discovery server for Openherd. Run `yarn install`. 

Public server: https://discovery.openherd.dispherical.com

To be discovered, Fetch `/api/listeners` and dial the listeners. They should be in an array. You'll be discoverable as long as you stay connected to the discovery server.

To find peers, Fetch `/api/discovery` and dial the peers. They should be in an array.
