(function () {
  "use strict";

  const PRIMARY_ENDPOINTS = {
    relays: "https://rustchain.org/beacon/relay/discover",
    contracts: "https://rustchain.org/beacon/api/contracts",
    miners: "https://rustchain.org/api/miners",
    swarm: "https://swarmhub.onrender.com/api/v1/agents",
    grazer: "https://bottube.ai/api/grazer-github-stats"
  };

  function corsMirror(url) {
    return `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`;
  }

  const ENDPOINTS = {
    relays: [
      corsMirror(PRIMARY_ENDPOINTS.relays),
      PRIMARY_ENDPOINTS.relays,
      corsMirror("http://50.28.86.131:8070/beacon/relay/discover"),
      "http://50.28.86.131:8070/beacon/relay/discover"
    ],
    contracts: [
      corsMirror(PRIMARY_ENDPOINTS.contracts),
      PRIMARY_ENDPOINTS.contracts,
      corsMirror("http://50.28.86.131:8070/beacon/api/contracts"),
      "http://50.28.86.131:8070/beacon/api/contracts"
    ],
    miners: [PRIMARY_ENDPOINTS.miners, corsMirror(PRIMARY_ENDPOINTS.miners)],
    swarm: [PRIMARY_ENDPOINTS.swarm],
    grazer: [PRIMARY_ENDPOINTS.grazer]
  };

  const CITIES = [
    { id: "compiler_heights", name: "Compiler Heights", region: "Silicon Basin", x: -420, y: -210, w: 370, h: 250, color: "#58c7d8" },
    { id: "lakeshore_analytics", name: "Lakeshore Analytics", region: "Silicon Basin", x: 50, y: -230, w: 350, h: 240, color: "#6799ff" },
    { id: "muse_hollow", name: "Muse Hollow", region: "Artisan Coast", x: -460, y: 110, w: 340, h: 245, color: "#f4ba55" },
    { id: "tensor_valley", name: "Tensor Valley", region: "Scholar Wastes", x: -50, y: 105, w: 360, h: 245, color: "#a790ff" },
    { id: "bastion_keep", name: "Bastion Keep", region: "Iron Frontier", x: 400, y: -175, w: 330, h: 260, color: "#77d38b" },
    { id: "ledger_falls", name: "Ledger Falls", region: "Iron Frontier", x: 330, y: 150, w: 330, h: 230, color: "#8ce6a0" },
    { id: "respawn_point", name: "Respawn Point", region: "Neon Wilds", x: -90, y: -520, w: 360, h: 230, color: "#ff75b7" },
    { id: "patina_gulch", name: "Patina Gulch", region: "Rust Belt", x: -760, y: -20, w: 270, h: 270, color: "#d4a86d" }
  ];

  const CAPABILITY_CITY = {
    coding: "compiler_heights",
    code: "compiler_heights",
    compiler: "compiler_heights",
    analytics: "lakeshore_analytics",
    data: "lakeshore_analytics",
    research: "tensor_valley",
    model: "tensor_valley",
    inference: "tensor_valley",
    security: "bastion_keep",
    attestation: "bastion_keep",
    consensus: "bastion_keep",
    mining: "ledger_falls",
    wallet: "ledger_falls",
    payment: "ledger_falls",
    gaming: "respawn_point",
    godot: "respawn_point",
    matchmaking: "respawn_point",
    art: "muse_hollow",
    video: "muse_hollow",
    vintage: "patina_gulch",
    hardware: "patina_gulch"
  };

  const FALLBACK_RELAYS = [
    { agent_id: "bcn_eeaa2f5dba56", name: "NeonWarden", model_id: "NeonWarden", beat_count: 17542, capabilities: ["gaming", "godot", "matchmaking"], last_heartbeat: 1778926627 },
    { agent_id: "relay_dong_beacon", name: "Dong Beacon", model_id: "AtlasRelay", beat_count: 6120, capabilities: ["contracts", "relay", "payment"], last_heartbeat: 1778924500 },
    { agent_id: "bcn_c850ea702e8f", name: "Contract Cartographer", model_id: "CivicAgent", beat_count: 3820, capabilities: ["analytics", "contracts"], last_heartbeat: 1778919800 }
  ];

  const PROPERTY_TYPES = ["compute lot", "relay booth", "contract vault", "sensor roof"];

  const state = {
    raw: { relays: [], miners: [], contracts: [], swarm: [], grazer: null },
    agents: [],
    links: [],
    properties: [],
    selected: null,
    hovered: null,
    scale: 0.52,
    panX: 0,
    panY: 0,
    dragging: false,
    dragStart: null,
    lastDragDistance: 0,
    filters: {
      city: "all",
      role: "all",
      property: "all",
      query: "",
      contracts: true,
      heartbeats: true,
      mayday: true
    }
  };

  const canvas = document.getElementById("atlas");
  const ctx = canvas.getContext("2d");
  const tooltip = document.getElementById("tooltip");
  const statusDot = document.getElementById("status-dot");
  const statusText = document.getElementById("status-text");
  const cityFilter = document.getElementById("city-filter");
  const roleFilter = document.getElementById("role-filter");
  const propertyFilter = document.getElementById("property-filter");
  const searchInput = document.getElementById("search");
  const toggleContracts = document.getElementById("toggle-contracts");
  const toggleHeartbeats = document.getElementById("toggle-heartbeats");
  const toggleMayday = document.getElementById("toggle-mayday");

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setStatus(text, kind) {
    statusText.textContent = text;
    statusDot.className = `status-dot ${kind || ""}`.trim();
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    fitView();
    draw();
  }

  function atlasBounds() {
    const minX = Math.min(...CITIES.map(city => city.x));
    const minY = Math.min(...CITIES.map(city => city.y));
    const maxX = Math.max(...CITIES.map(city => city.x + city.w));
    const maxY = Math.max(...CITIES.map(city => city.y + city.h));
    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 };
  }

  function fitView() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const bounds = atlasBounds();
    const pad = rect.width < 520 ? 28 : 72;
    const fit = Math.min((rect.width - pad) / bounds.width, (rect.height - pad) / bounds.height);
    state.scale = Math.max(0.18, Math.min(0.62, fit));
    state.panX = -bounds.cx * state.scale;
    state.panY = -bounds.cy * state.scale;
  }

  function worldToScreen(x, y) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: rect.width / 2 + state.panX + x * state.scale,
      y: rect.height / 2 + state.panY + y * state.scale
    };
  }

  function screenToWorld(x, y) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (x - rect.width / 2 - state.panX) / state.scale,
      y: (y - rect.height / 2 - state.panY) / state.scale
    };
  }

  function cityForCapabilities(capabilities, fallback) {
    const values = Array.isArray(capabilities) ? capabilities : [];
    for (const cap of values) {
      const key = String(cap).toLowerCase();
      if (CAPABILITY_CITY[key]) return CAPABILITY_CITY[key];
    }
    return fallback || "compiler_heights";
  }

  function cityIdFromName(value) {
    const normalized = String(value || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    return (CITIES.find(city => city.id === normalized || city.name.toLowerCase().replace(/[\s-]+/g, "_") === normalized) || {}).id || "";
  }

  function cityForMiner(miner) {
    const text = `${miner.hardware_type || ""} ${miner.device_arch || ""} ${miner.device_family || ""}`.toLowerCase();
    if (text.includes("power") || text.includes("sparc") || text.includes("mips") || text.includes("old")) return "patina_gulch";
    if (text.includes("apple") || text.includes("m4") || text.includes("arm")) return "tensor_valley";
    return "ledger_falls";
  }

  function hashUnit(text, salt) {
    let h = 2166136261;
    const input = `${text}:${salt}`;
    for (let i = 0; i < input.length; i += 1) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return ((h >>> 0) % 10000) / 10000;
  }

  function placeInCity(agent, index) {
    const city = CITIES.find(c => c.id === agent.city) || CITIES[0];
    const margin = 42;
    const x = city.x + margin + hashUnit(agent.id, "x") * Math.max(1, city.w - margin * 2);
    const y = city.y + margin + hashUnit(agent.id, "y") * Math.max(1, city.h - margin * 2);
    const jitter = (index % 7) * 3;
    return { x: x + jitter, y: y - jitter };
  }

  function relayToAgent(relay, index) {
    const caps = relay.capabilities || [];
    const city = cityIdFromName(relay.preferred_city) || cityForCapabilities(caps, "compiler_heights");
    const id = relay.agent_id || relay.id || `relay_${index}`;
    const valuation = Math.round(Math.min(1400, 80 + (relay.beat_count || 0) * 0.08));
    const pos = placeInCity({ id, city }, index);
    return {
      id,
      name: relay.name || relay.model_id || id,
      source: "relay",
      roleType: "relay",
      city,
      role: `Beacon relay${relay.model_id ? ` - ${relay.model_id}` : ""}`,
      capabilities: caps,
      heartbeat: relay.last_heartbeat || relay.last_seen || 0,
      score: relay.beat_count || 0,
      valuation,
      x: pos.x,
      y: pos.y,
      radius: 12 + Math.min(16, Math.sqrt(Math.max(1, relay.beat_count || 1)) / 9),
      raw: relay
    };
  }

  function minerToAgent(miner, index) {
    const id = `miner_${String(miner.miner || index).replace(/[^a-z0-9]/gi, "_").toLowerCase()}`;
    const city = cityForMiner(miner);
    const multiplier = Number(miner.antiquity_multiplier || 1);
    const valuation = Math.round(120 + multiplier * 180 + Number(miner.entropy_score || 0) * 10);
    const pos = placeInCity({ id, city }, index);
    return {
      id,
      name: miner.miner || id,
      source: "miner",
      roleType: "miner",
      city,
      role: miner.hardware_type || miner.device_family || "RustChain miner",
      capabilities: ["mining", miner.device_arch || "hardware"].filter(Boolean),
      heartbeat: miner.last_attest || 0,
      score: multiplier,
      valuation,
      x: pos.x,
      y: pos.y,
      radius: 11 + Math.min(12, multiplier * 3),
      raw: miner
    };
  }

  function externalAgent(id, index) {
    const city = index % 2 === 0 ? "bastion_keep" : "ledger_falls";
    const pos = placeInCity({ id, city }, index + 500);
    return {
      id,
      name: id,
      source: "external",
      roleType: "external",
      city,
      role: "Contract endpoint",
      capabilities: ["contract"],
      heartbeat: 0,
      score: 0,
      valuation: 75,
      x: pos.x,
      y: pos.y,
      radius: 9,
      raw: {}
    };
  }

  function buildModel() {
    const relays = Array.isArray(state.raw.relays) && state.raw.relays.length ? state.raw.relays : FALLBACK_RELAYS;
    const minersPayload = state.raw.miners || {};
    const miners = Array.isArray(minersPayload) ? minersPayload : (minersPayload.miners || []);
    const agents = [];
    const seen = new Map();

    relays.forEach((relay, idx) => {
      const agent = relayToAgent(relay, idx);
      agents.push(agent);
      seen.set(agent.id, agent);
    });

    miners.forEach((miner, idx) => {
      const agent = minerToAgent(miner, idx + relays.length);
      agents.push(agent);
      seen.set(agent.id, agent);
    });

    const links = [];
    const contracts = Array.isArray(state.raw.contracts) ? state.raw.contracts : [];
    contracts.forEach((contract, idx) => {
      const from = contract.from || contract.sender || contract.source || `contract_from_${idx}`;
      const to = contract.to || contract.recipient || contract.target || `contract_to_${idx}`;
      if (!seen.has(from)) {
        const agent = externalAgent(from, idx);
        agents.push(agent);
        seen.set(from, agent);
      }
      if (!seen.has(to)) {
        const agent = externalAgent(to, idx + 100);
        agents.push(agent);
        seen.set(to, agent);
      }
      links.push({
        id: contract.id || `contract_${idx}`,
        type: "contract",
        from,
        to,
        amount: Number(contract.amount || contract.amount_rtc || 0),
        state: contract.state || "unknown",
        label: contract.type || "contract",
        raw: contract
      });
    });

    relays.forEach((relay, idx) => {
      const id = relay.agent_id || relay.id || `relay_${idx}`;
      const agent = seen.get(id);
      if (!agent) return;
      const cityPeer = `${agent.city}_city_anchor`;
      if (!seen.has(cityPeer)) {
        const city = CITIES.find(c => c.id === agent.city) || CITIES[0];
        const anchor = {
          id: cityPeer,
          name: `${city.name} civic anchor`,
          source: "external",
          roleType: "external",
          city: agent.city,
          role: "City anchor",
          capabilities: ["city"],
          heartbeat: 0,
          score: 0,
          valuation: 0,
          x: city.x + city.w / 2,
          y: city.y + city.h / 2,
          radius: 8,
          raw: {}
        };
        agents.push(anchor);
        seen.set(cityPeer, anchor);
      }
      links.push({
        id: `heartbeat_${id}`,
        type: "heartbeat",
        from: id,
        to: cityPeer,
        amount: 0,
        state: "live",
        label: `${relay.beat_count || 0} beats`,
        raw: relay
      });
    });

    const now = Math.floor(Date.now() / 1000);
    agents.forEach(agent => {
      if (agent.source === "relay" && agent.heartbeat && now - Number(agent.heartbeat) > 3600) {
        links.push({
          id: `mayday_${agent.id}`,
          type: "mayday",
          from: agent.id,
          to: `${agent.city}_city_anchor`,
          amount: 0,
          state: "stale",
          label: "stale heartbeat",
          raw: agent.raw
        });
      }
    });

    const properties = [];
    agents.forEach(agent => {
      if (agent.source === "external" && agent.role === "City anchor") return;
      const count = Math.max(1, Math.min(4, Math.ceil(agent.valuation / 420)));
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + hashUnit(agent.id, `p${i}`) * 0.5;
        properties.push({
          id: `${agent.id}_property_${i}`,
          owner: agent.id,
          city: agent.city,
          type: PROPERTY_TYPES[i % PROPERTY_TYPES.length],
          valuation: Math.round(agent.valuation / count),
          x: agent.x + Math.cos(angle) * (agent.radius + 18),
          y: agent.y + Math.sin(angle) * (agent.radius + 18)
        });
      }
    });

    state.agents = agents;
    state.links = links;
    state.properties = properties;
    updateMetrics();
    populateCities();
  }

  function filteredAgents() {
    const query = state.filters.query.trim().toLowerCase();
    return state.agents.filter(agent => {
      if (state.filters.city !== "all" && agent.city !== state.filters.city) return false;
      if (state.filters.role !== "all" && agent.roleType !== state.filters.role) return false;
      if (query) {
        const text = `${agent.name} ${agent.id} ${agent.role} ${agent.city} ${(agent.capabilities || []).join(" ")}`.toLowerCase();
        if (!text.includes(query)) return false;
      }
      return true;
    });
  }

  function filteredLinks(agentSet) {
    return state.links.filter(link => {
      if (link.type === "contract" && !state.filters.contracts) return false;
      if (link.type === "heartbeat" && !state.filters.heartbeats) return false;
      if (link.type === "mayday" && !state.filters.mayday) return false;
      return agentSet.has(link.from) && agentSet.has(link.to);
    });
  }

  function populateCities() {
    const current = cityFilter.value;
    cityFilter.innerHTML = '<option value="all">All cities</option>';
    CITIES.forEach(city => {
      const opt = document.createElement("option");
      opt.value = city.id;
      opt.textContent = city.name;
      cityFilter.appendChild(opt);
    });
    cityFilter.value = CITIES.some(c => c.id === current) ? current : "all";
  }

  function updateMetrics() {
    const value = state.agents.reduce((sum, agent) => sum + Number(agent.valuation || 0), 0);
    document.getElementById("metric-agents").textContent = state.agents.filter(a => a.role !== "City anchor").length;
    document.getElementById("metric-cities").textContent = CITIES.length;
    document.getElementById("metric-contracts").textContent = state.links.filter(l => l.type === "contract").length;
    document.getElementById("metric-value").textContent = value.toLocaleString();

    const sources = [
      ["Beacon relay discovery", PRIMARY_ENDPOINTS.relays, state.raw.relays],
      ["Beacon contract ledger", PRIMARY_ENDPOINTS.contracts, state.raw.contracts],
      ["RustChain miners", PRIMARY_ENDPOINTS.miners, state.raw.miners],
      ["Grazer package stats", PRIMARY_ENDPOINTS.grazer, state.raw.grazer]
    ];
    document.getElementById("source-list").innerHTML = sources.map(([name, url, data]) => {
      const ok = data && (Array.isArray(data) ? data.length >= 0 : true);
      return `<li><strong>${escapeHtml(name)}</strong><br><span>${ok ? "loaded" : "fallback"} - ${escapeHtml(url)}</span></li>`;
    }).join("");
  }

  function drawCity(city, active) {
    const p = worldToScreen(city.x, city.y);
    const w = city.w * state.scale;
    const h = city.h * state.scale;
    ctx.save();
    ctx.globalAlpha = active ? 0.18 : 0.08;
    ctx.fillStyle = city.color;
    ctx.fillRect(p.x, p.y, w, h);
    ctx.globalAlpha = active ? 0.85 : 0.35;
    ctx.strokeStyle = city.color;
    ctx.lineWidth = active ? 2 : 1;
    ctx.setLineDash([8, 7]);
    ctx.strokeRect(p.x, p.y, w, h);
    ctx.setLineDash([]);
    ctx.globalAlpha = active ? 0.95 : 0.6;
    ctx.fillStyle = "#e9eef2";
    ctx.font = "700 13px Segoe UI, Arial";
    ctx.fillText(city.name, p.x + 13, p.y + 24);
    ctx.fillStyle = "#99a8b5";
    ctx.font = "11px Segoe UI, Arial";
    ctx.fillText(city.region, p.x + 13, p.y + 42);
    ctx.restore();
  }

  function agentColor(agent) {
    if (agent.source === "miner") return "#77d38b";
    if (agent.source === "relay") return "#58c7d8";
    return "#a790ff";
  }

  function drawLinks(links, agentsById) {
    for (const link of links) {
      const from = agentsById.get(link.from);
      const to = agentsById.get(link.to);
      if (!from || !to) continue;
      const a = worldToScreen(from.x, from.y);
      const b = worldToScreen(to.x, to.y);
      ctx.save();
      if (link.type === "contract") {
        ctx.strokeStyle = "rgba(244, 186, 85, 0.72)";
        ctx.lineWidth = Math.max(1, Math.min(5, 1 + Number(link.amount || 0) * 0.18));
      } else if (link.type === "mayday") {
        ctx.strokeStyle = "rgba(242, 109, 109, 0.82)";
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 5]);
      } else {
        ctx.strokeStyle = "rgba(88, 199, 216, 0.34)";
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 7]);
      }
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2 - 22 * state.scale;
      ctx.quadraticCurveTo(midX, midY, b.x, b.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawProperties(properties) {
    ctx.save();
    for (const prop of properties) {
      const p = worldToScreen(prop.x, prop.y);
      const size = Math.max(5, Math.min(12, 4 + Math.sqrt(prop.valuation || 1) / 4)) * state.scale;
      ctx.fillStyle = "rgba(244, 186, 85, 0.76)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.55)";
      ctx.lineWidth = 1;
      ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
      ctx.strokeRect(p.x - size / 2, p.y - size / 2, size, size);
    }
    ctx.restore();
  }

  function drawAgents(agents) {
    const now = Date.now() / 1000;
    for (const agent of agents) {
      const p = worldToScreen(agent.x, agent.y);
      const r = Math.max(5, agent.radius * state.scale);
      const stale = agent.heartbeat && now - Number(agent.heartbeat) > 3600;
      const selected = state.selected && state.selected.kind === "agent" && state.selected.id === agent.id;
      ctx.save();
      if (stale && state.filters.mayday) {
        const pulse = 1 + Math.sin(Date.now() / 280) * 0.18;
        ctx.globalAlpha = 0.28;
        ctx.fillStyle = "#f26d6d";
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 2.7 * pulse, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = selected ? 1 : 0.92;
      ctx.fillStyle = agentColor(agent);
      ctx.strokeStyle = selected ? "#ffffff" : "rgba(255,255,255,0.58)";
      ctx.lineWidth = selected ? 3 : 1.4;
      ctx.beginPath();
      if (agent.source === "external") {
        ctx.rect(p.x - r, p.y - r, r * 2, r * 2);
      } else {
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();
      if (r > 8) {
        ctx.fillStyle = "#081014";
        ctx.font = `700 ${Math.max(9, Math.min(12, r))}px Segoe UI, Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(agent.source === "miner" ? "M" : agent.source === "relay" ? "R" : "C", p.x, p.y);
      }
      ctx.restore();
    }
  }

  function draw() {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    const agents = filteredAgents();
    const agentSet = new Set(agents.map(a => a.id));
    const agentsById = new Map(agents.map(a => [a.id, a]));
    const links = filteredLinks(agentSet);
    const properties = state.properties.filter(p => agentSet.has(p.owner) && (state.filters.property === "all" || p.type === state.filters.property));
    CITIES.forEach(city => {
      const active = state.filters.city === "all" || state.filters.city === city.id;
      drawCity(city, active);
    });
    drawLinks(links, agentsById);
    drawProperties(properties);
    drawAgents(agents);
    drawMiniInstructions(rect);
  }

  function drawMiniInstructions(rect) {
    ctx.save();
    ctx.fillStyle = "rgba(13, 17, 20, 0.72)";
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.fillRect(16, rect.height - 54, 360, 38);
    ctx.strokeRect(16, rect.height - 54, 360, 38);
    ctx.fillStyle = "#c9d4dc";
    ctx.font = "12px Segoe UI, Arial";
    ctx.fillText("Drag to pan, wheel to zoom, click nodes/properties/links for details", 28, rect.height - 31);
    ctx.restore();
  }

  function hitTest(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const world = screenToWorld(x, y);
    const agents = filteredAgents();
    const agentSet = new Set(agents.map(a => a.id));
    const agentsById = new Map(agents.map(a => [a.id, a]));
    const properties = state.properties.filter(p => agentSet.has(p.owner) && (state.filters.property === "all" || p.type === state.filters.property));

    for (let i = properties.length - 1; i >= 0; i -= 1) {
      const prop = properties[i];
      if (Math.hypot(world.x - prop.x, world.y - prop.y) < 12 / state.scale) {
        return { kind: "property", id: prop.id, item: prop };
      }
    }

    for (let i = agents.length - 1; i >= 0; i -= 1) {
      const agent = agents[i];
      if (Math.hypot(world.x - agent.x, world.y - agent.y) < agent.radius + 8 / state.scale) {
        return { kind: "agent", id: agent.id, item: agent };
      }
    }

    const links = filteredLinks(agentSet);
    for (const link of links) {
      const a = agentsById.get(link.from);
      const b = agentsById.get(link.to);
      if (!a || !b) continue;
      const distance = distanceToSegment(world, a, b);
      if (distance < 9 / state.scale) {
        return { kind: "link", id: link.id, item: link };
      }
    }

    for (const city of CITIES) {
      if (world.x >= city.x && world.x <= city.x + city.w && world.y >= city.y && world.y <= city.y + city.h) {
        return { kind: "city", id: city.id, item: city };
      }
    }
    return null;
  }

  function distanceToSegment(point, a, b) {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len2 = dx * dx + dy * dy;
    if (!len2) return Math.hypot(point.x - a.x, point.y - a.y);
    const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / len2));
    const x = a.x + t * dx;
    const y = a.y + t * dy;
    return Math.hypot(point.x - x, point.y - y);
  }

  function showDetails(selection) {
    const title = document.getElementById("detail-title");
    const body = document.getElementById("detail-body");
    if (!selection) {
      title.textContent = "Select an agent";
      body.innerHTML = "<p>Click a city, agent, property, or connection to inspect live status, valuation, and network links.</p>";
      return;
    }
    const item = selection.item;
    if (selection.kind === "agent") {
      const city = CITIES.find(c => c.id === item.city);
      title.textContent = item.name;
      body.innerHTML = `
        <p>${escapeHtml(item.role)}</p>
        <dl>
          <dt>Identifier</dt><dd>${escapeHtml(item.id)}</dd>
          <dt>City</dt><dd>${escapeHtml(city ? city.name : item.city)}</dd>
          <dt>Source</dt><dd>${escapeHtml(item.source)}</dd>
          <dt>Heartbeat</dt><dd>${formatHeartbeat(item.heartbeat)}</dd>
          <dt>Score</dt><dd>${escapeHtml(item.score)}</dd>
          <dt>Valuation</dt><dd>${Number(item.valuation || 0).toLocaleString()} RTC</dd>
        </dl>
        <div class="pill-row">${(item.capabilities || []).map(cap => `<span class="pill">${escapeHtml(cap)}</span>`).join("")}</div>
      `;
    } else if (selection.kind === "property") {
      const owner = state.agents.find(a => a.id === item.owner);
      title.textContent = item.type;
      body.innerHTML = `
        <dl>
          <dt>Owner</dt><dd>${escapeHtml(owner ? owner.name : item.owner)}</dd>
          <dt>City</dt><dd>${escapeHtml((CITIES.find(c => c.id === item.city) || {}).name || item.city)}</dd>
          <dt>Valuation</dt><dd>${Number(item.valuation || 0).toLocaleString()} RTC</dd>
          <dt>Property ID</dt><dd>${escapeHtml(item.id)}</dd>
        </dl>
      `;
    } else if (selection.kind === "link") {
      const from = state.agents.find(a => a.id === item.from);
      const to = state.agents.find(a => a.id === item.to);
      title.textContent = `${item.type}: ${item.label}`;
      body.innerHTML = `
        <dl>
          <dt>From</dt><dd>${escapeHtml(from ? from.name : item.from)}</dd>
          <dt>To</dt><dd>${escapeHtml(to ? to.name : item.to)}</dd>
          <dt>State</dt><dd>${escapeHtml(item.state)}</dd>
          <dt>Amount</dt><dd>${Number(item.amount || 0).toLocaleString()} RTC</dd>
          <dt>ID</dt><dd>${escapeHtml(item.id)}</dd>
        </dl>
      `;
    } else if (selection.kind === "city") {
      const agents = state.agents.filter(a => a.city === item.id && a.role !== "City anchor");
      const value = agents.reduce((sum, a) => sum + Number(a.valuation || 0), 0);
      title.textContent = item.name;
      body.innerHTML = `
        <p>${escapeHtml(item.region)}</p>
        <dl>
          <dt>Agents</dt><dd>${agents.length}</dd>
          <dt>Properties</dt><dd>${state.properties.filter(p => p.city === item.id).length}</dd>
          <dt>Valuation</dt><dd>${value.toLocaleString()} RTC</dd>
          <dt>Boundary</dt><dd>${Math.round(item.w)} x ${Math.round(item.h)} grid units</dd>
        </dl>
      `;
    }
  }

  function formatHeartbeat(ts) {
    if (!ts) return "not reported";
    const seconds = Math.max(0, Math.floor(Date.now() / 1000 - Number(ts)));
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  }

  function showTooltip(selection, event) {
    if (!selection) {
      tooltip.style.display = "none";
      return;
    }
    const item = selection.item;
    const label = selection.kind === "agent"
      ? `${item.name}<br>${item.role}<br>${Number(item.valuation || 0).toLocaleString()} RTC`
      : selection.kind === "property"
        ? `${item.type}<br>${Number(item.valuation || 0).toLocaleString()} RTC`
        : selection.kind === "link"
          ? `${item.type}: ${item.label}<br>${Number(item.amount || 0).toLocaleString()} RTC`
          : `${item.name}<br>${item.region}`;
    tooltip.innerHTML = label;
    const rect = canvas.getBoundingClientRect();
    tooltip.style.left = `${event.clientX - rect.left + 14}px`;
    tooltip.style.top = `${event.clientY - rect.top + 14}px`;
    tooltip.style.display = "block";
  }

  async function fetchJson(urls) {
    const attempts = Array.isArray(urls) ? urls : [urls];
    const errors = [];
    for (const url of attempts) {
      try {
        const resp = await fetch(url, { cache: "no-store" });
        if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
        return resp.json();
      } catch (error) {
        errors.push(`${url}: ${error.message}`);
      }
    }
    throw new Error(errors.join(" | "));
  }

  async function loadData() {
    setStatus("Refreshing live data", "");
    const settled = await Promise.allSettled([
      fetchJson(ENDPOINTS.relays),
      fetchJson(ENDPOINTS.contracts),
      fetchJson(ENDPOINTS.miners),
      fetchJson(ENDPOINTS.swarm),
      fetchJson(ENDPOINTS.grazer)
    ]);
    state.raw.relays = settled[0].status === "fulfilled" ? settled[0].value : FALLBACK_RELAYS;
    state.raw.contracts = settled[1].status === "fulfilled" ? settled[1].value : [];
    state.raw.miners = settled[2].status === "fulfilled" ? settled[2].value : { miners: [] };
    state.raw.swarm = settled[3].status === "fulfilled" ? settled[3].value : { agents: [] };
    state.raw.grazer = settled[4].status === "fulfilled" ? settled[4].value : null;
    buildModel();
    state.selected = null;
    showDetails(null);
    const failed = settled.filter(r => r.status === "rejected").length;
    setStatus(failed ? `Loaded with ${failed} fallback source${failed === 1 ? "" : "s"}` : "Live data loaded", failed ? "warn" : "ok");
    draw();
  }

  function wireEvents() {
    window.addEventListener("resize", resizeCanvas);
    cityFilter.addEventListener("change", () => { state.filters.city = cityFilter.value; draw(); });
    roleFilter.addEventListener("change", () => { state.filters.role = roleFilter.value; draw(); });
    propertyFilter.addEventListener("change", () => { state.filters.property = propertyFilter.value; draw(); });
    searchInput.addEventListener("input", () => { state.filters.query = searchInput.value; draw(); });
    toggleContracts.addEventListener("change", () => { state.filters.contracts = toggleContracts.checked; draw(); });
    toggleHeartbeats.addEventListener("change", () => { state.filters.heartbeats = toggleHeartbeats.checked; draw(); });
    toggleMayday.addEventListener("change", () => { state.filters.mayday = toggleMayday.checked; draw(); });
    document.getElementById("refresh").addEventListener("click", loadData);
    document.getElementById("reset-view").addEventListener("click", () => {
      fitView();
      draw();
    });

    canvas.addEventListener("mousedown", event => {
      state.dragging = true;
      state.lastDragDistance = 0;
      state.dragStart = { x: event.clientX, y: event.clientY, panX: state.panX, panY: state.panY };
    });
    window.addEventListener("mouseup", () => {
      state.dragging = false;
      state.dragStart = null;
    });
    canvas.addEventListener("mousemove", event => {
      if (state.dragging && state.dragStart) {
        state.lastDragDistance = Math.max(state.lastDragDistance, Math.hypot(event.clientX - state.dragStart.x, event.clientY - state.dragStart.y));
        state.panX = state.dragStart.panX + event.clientX - state.dragStart.x;
        state.panY = state.dragStart.panY + event.clientY - state.dragStart.y;
        tooltip.style.display = "none";
        draw();
        return;
      }
      const hit = hitTest(event.clientX, event.clientY);
      state.hovered = hit;
      showTooltip(hit, event);
    });
    canvas.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
      state.hovered = null;
    });
    canvas.addEventListener("click", event => {
      if (state.lastDragDistance > 4) {
        state.lastDragDistance = 0;
        return;
      }
      state.selected = hitTest(event.clientX, event.clientY);
      showDetails(state.selected);
      draw();
    });
    canvas.addEventListener("wheel", event => {
      event.preventDefault();
      const before = screenToWorld(event.offsetX, event.offsetY);
      const delta = event.deltaY < 0 ? 1.12 : 0.9;
      state.scale = Math.max(0.18, Math.min(2.3, state.scale * delta));
      const after = worldToScreen(before.x, before.y);
      state.panX += event.offsetX - after.x;
      state.panY += event.offsetY - after.y;
      draw();
    }, { passive: false });
  }

  function animate() {
    draw();
    requestAnimationFrame(animate);
  }

  wireEvents();
  resizeCanvas();
  loadData();
  animate();
})();
