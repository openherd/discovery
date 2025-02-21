import { createLibp2p } from "libp2p";
import { tcp } from "@libp2p/tcp";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { identify, identifyPush } from "@libp2p/identify";
import { webSockets } from "@libp2p/websockets";
import { circuitRelayServer } from "@libp2p/circuit-relay-v2";
import { autoNAT } from "@libp2p/autonat";
import dotenv from "dotenv";
import express from "express";

dotenv.config();


(async () => {
    const app = express();
    const publicIp = process.env.PUBLIC_IP || (await (await fetch('https://api.ipify.org?format=json')).json()).ip
    const node = await createLibp2p({
        addresses: {
            announce: [
                `/ip4/${publicIp}/tcp/${process.env.REGULAR_PORT}`,
                `/ip4/${publicIp}/tcp/${process.env.WS_PORT}/ws`  
            ]
        },
        transports: [webSockets(), tcp()],
        connectionEncrypters: [noise()],
        connectionGater: {
            denyDialMultiaddr: async () => false,
        },
        services: {
            identify: identify(),
            identifyPush: identifyPush(),
            pubsub: gossipsub({
                allowPublishToZeroTopicPeers: true,
                maxInboundDataLength: 1024 * 8,
                enabled: true,
                globalSignaturePolicy: "StrictSign",
            }),
            autoNat: autoNAT(),
            relay: circuitRelayServer(),
        },
        streamMuxers: [
            yamux({
                enableKeepAlive: true,
                maxInboundStreams: 100,
                maxOutboundStreams: 100,
            }),
        ],
    });
    await node.start();
    console.log("libp2p has started");
    console.log("listening on addresses:");
    node.getMultiaddrs().forEach((addr) => {
        console.log(addr.toString());
    });
    app.get("/api/listeners", async (req, res) => {
        res.json(node.getMultiaddrs().map((addr) => {
            return addr.toString()
        }));
    });

    app.get("/api/discovery", async (req, res) => {
        const connections = node.getConnections();
        const peerAddresses = connections.map(conn => {
            const peerId = conn.remotePeer.toString();
            const multiaddr = conn.remoteAddr.toString();
            return `${multiaddr}/p2p/${peerId}`;
        });
        res.json(peerAddresses);
    });

    app.listen(process.env.PORT || 8086, () => {
        console.log(`Discovery listening on port ${process.env.PORT || 8086}`)
    })

})();