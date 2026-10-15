export const resourceGroups = [
  {
    title: "Build with Kamailio",
    items: [
      ["Documentation", "/docs"],
      ["Module reference", "/docs/modules/6.1.x"],
      ["Development modules", "/docs/modules/devel"],
      ["Wiki & cookbooks", "/docs/collections/wiki"],
      ["Conference materials", "/docs/presentations"],
      ["Download & install", "/download"],
      ["Developer guide", "https://www.asipto.com/pub/kamailio-devel-guide/"],
    ],
  },
  {
    title: "The project",
    items: [
      ["About Kamailio", "/about"],
      ["Features", "/platform"],
      ["Project history", "/content/history"],
      ["Management", "/content/management"],
      ["Administration", "/content/kadmin"],
      [
        "Logos & assets",
        "https://www.kamailio.org/pub/kamailio-logos/current/",
      ],
    ],
  },
  {
    title: "The ecosystem",
    items: [
      ["Community & support", "/community"],
      ["Business directory", "/content/business-directory"],
      ["Used by", "/content/used-by"],
      ["Related projects", "/content/related-projects"],
      ["Interoperability", "/content/interoperability"],
      ["SIP services", "/content/sip-services"],
    ],
  },
  {
    title: "Get involved",
    items: [
      ["News & releases", "/news"],
      ["Mailing lists", "/content/mailing-lists"],
      ["Chat channels", "/content/irc-channels"],
      ["Public events", "/content/public-events"],
      ["Contribute on GitHub", "https://github.com/kamailio/kamailio"],
      ["Report an issue", "https://github.com/kamailio/kamailio/issues"],
      ["Donate", "/content/donations"],
      ["Contact", "/content/contact-us"],
    ],
  },
  {
    title: "Legacy & references",
    items: [
      ["References", "/content/references"],
      ["Business information", "/content/business"],
      ["Old wiki (≤ 5.5.x)", "/docs/collections/wiki"],
      ["Old wiki (≤ 3.1.x)", "/docs/collections/legacy"],
      ["SourceForge archive", "https://sourceforge.net/projects/openser/"],
      [
        "Code of conduct",
        "https://github.com/kamailio/kamailio/blob/master/CODE_OF_CONDUCT.md",
      ],
    ],
  },
];
export const capabilities = [
  {
    title: "Route with precision.",
    desc: "Load balancing, least-cost routing, failover, and NAT traversal. Build the signaling layer your network needs.",
    icon: "route",
    tags: ["SIP PROXY", "LOAD BALANCING", "REGISTRAR"],
  },
  {
    title: "Connect every endpoint.",
    desc: "Bring voice, video, presence, and messaging together. Bridge SIP networks and browsers with WebRTC.",
    icon: "globe",
    tags: ["WEBRTC", "IMS / VoLTE", "MSRP"],
  },
  {
    title: "Secure every session.",
    desc: "TLS signaling, authentication, access control, and topology hiding. Put protection at the edge of your network.",
    icon: "shield",
    tags: ["TLS", "AUTHENTICATION", "TOPOLOGY HIDING"],
  },
  {
    title: "Make it your own.",
    desc: "A modular C core, powerful configuration, and scripting with KEMI. Connect your databases and build beyond the defaults.",
    icon: "code",
    tags: ["PYTHON / LUA / JS", "RPC", "DATABASES"],
  },
];
