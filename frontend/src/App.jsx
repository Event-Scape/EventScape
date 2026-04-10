import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { MB_TOK } from "./config";
import { TC } from "./demoData";
import { useAppStore } from "./store";

function LoginOverlay() {
  const login = useAppStore((s) => s.login);
  const errorMessage = useAppStore((s) => s.errorMessage);
  const me = useAppStore((s) => s.me);
  const [name, setName] = useState("");
  const [uid, setUid] = useState("");
  if (me) return null;
  return (
    <div id="ls">
      <div className="au" style={{ width: 420, padding: "44px 40px 36px", background: "rgba(13,21,37,.9)", border: "1px solid var(--bd)", borderRadius: 28, backdropFilter: "blur(22px)" }}>
        <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-.04em", marginBottom: 3 }}>Event<span style={{ color: "var(--blue2)" }}>Scape</span></div>
        <div style={{ fontSize: 11, color: "var(--t3)", fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 30 }}>MICE 교육 플랫폼</div>
        {errorMessage ? <div id="lerr" style={{ background: "rgba(255,79,107,.12)", border: "1px solid rgba(255,79,107,.3)", borderRadius: 10, padding: "9px 13px", fontSize: 12.5, color: "#ff7891", marginBottom: 13 }}>{errorMessage}</div> : null}
        <div style={{ marginBottom: 13 }}><label className="fl">이름</label><input className="fi" placeholder="예: 김철수" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div style={{ marginBottom: 22 }}><label className="fl">학번 / 교번</label><input className="fi mono" placeholder="예: 2024001" value={uid} onChange={(e) => setUid(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login(name, uid).catch(() => useAppStore.getState().setError("이름 또는 학번/교번이 명단과 일치하지 않습니다."))} /></div>
        <button className="btn bb" style={{ width: "100%", padding: 13, fontSize: 14, borderRadius: 13 }} onClick={() => login(name, uid).catch(() => useAppStore.getState().setError("이름 또는 학번/교번이 명단과 일치하지 않습니다."))}>로그인 →</button>
      </div>
    </div>
  );
}

function MapView() {
  const mapRef = useRef(null);
  const elRef = useRef(null);
  const markersRef = useRef([]);
  const events = useAppStore((s) => s.events);
  const isDark = useAppStore((s) => s.isDark);
  const mapStyle = useAppStore((s) => s.mapStyle);
  const me = useAppStore((s) => s.me);
  const setMapClickPoint = useAppStore((s) => s.setMapClickPoint);
  const openDetail = useAppStore((s) => s.openDetail);

  useEffect(() => {
    if (!MB_TOK || !elRef.current || mapRef.current) return;
    mapboxgl.accessToken = MB_TOK;
    mapRef.current = new mapboxgl.Map({ container: elRef.current, style: "mapbox://styles/mapbox/navigation-night-v1", center: [60, 20], zoom: 1.8, projection: "globe" });
    mapRef.current.on("click", (e) => {
      if (!me || me.role === "professor") return;
      setMapClickPoint({ lat: e.lngLat.lat.toFixed(5), lng: e.lngLat.lng.toFixed(5), team: me.team || "" });
    });
    return () => mapRef.current?.remove();
  }, [me, setMapClickPoint]);

  useEffect(() => {
    if (!mapRef.current) return;
    const styleMap = { dark: "mapbox://styles/mapbox/navigation-night-v1", light: "mapbox://styles/mapbox/light-v11", satellite: "mapbox://styles/mapbox/satellite-v9" };
    mapRef.current.setStyle(styleMap[mapStyle]);
  }, [mapStyle]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const fog = isDark
      ? { color: "rgb(8,13,24)", "high-color": "rgb(18,38,85)", "space-color": "rgb(3,6,18)", "horizon-blend": 0.07 }
      : { color: "rgb(215,225,248)", "high-color": "rgb(180,205,255)", "space-color": "rgb(155,185,235)", "horizon-blend": 0.04 };
    const applyFog = () => map.setFog(fog);

    if (map.isStyleLoaded()) {
      applyFog();
      return;
    }

    map.once("style.load", applyFog);
  }, [isDark, mapStyle]);

  useEffect(() => {
    if (!mapRef.current) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    events.forEach((ev) => {
      const el = document.createElement("div");
      el.className = "pin";
      el.style.backgroundColor = (TC[ev.type] || TC.Convention).col;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        openDetail(ev);
      });
      markersRef.current.push(new mapboxgl.Marker(el).setLngLat([ev.lng, ev.lat]).addTo(mapRef.current));
    });
  }, [events, openDetail]);

  return <div id="map" ref={elRef} />;
}

function AppShell() {
  const me = useAppStore((s) => s.me);
  const events = useAppStore((s) => s.events);
  const teams = useAppStore((s) => s.teams);
  const isDark = useAppStore((s) => s.isDark);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const setMapStyle = useAppStore((s) => s.setMapStyle);
  const logout = useAppStore((s) => s.logout);
  const addTeam = useAppStore((s) => s.addTeam);
  const openRegister = useAppStore((s) => s.openRegister);
  const currentEvent = useAppStore((s) => s.currentEvent);
  const openDetail = useAppStore((s) => s.openDetail);
  const detailOpen = useAppStore((s) => s.detailOpen);
  const closeDetail = useAppStore((s) => s.closeDetail);
  const toggleLike = useAppStore((s) => s.toggleLike);
  const addFeedback = useAppStore((s) => s.addFeedback);
  const registerOpen = useAppStore((s) => s.registerOpen);
  const closeRegister = useAppStore((s) => s.closeRegister);
  const saveProject = useAppStore((s) => s.saveProject);
  const mapClickPoint = useAppStore((s) => s.mapClickPoint);
  const openChat = useAppStore((s) => s.openChat);
  const chatOpen = useAppStore((s) => s.chatOpen);
  const chatMessages = useAppStore((s) => s.chatMessages);
  const sendMessage = useAppStore((s) => s.sendMessage);
  const closeChat = useAppStore((s) => s.closeChat);
  const [fb, setFb] = useState("");
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ title: "", team: "", members: "", type: "Convention", field: "", loc: "", topic: "", description: "", scale: "" });

  const ranked = useMemo(() => [...events].sort((a, b) => b.votes - a.votes).slice(0, 10), [events]);
  const listTeams = me?.role === "student" ? teams.filter((t) => t.name === me.team) : teams;

  if (!me) return null;
  return (
    <div id="body" className={isDark ? "" : "lm"}>
      <div id="app">
        <aside className="sidebar" id="sl">
          <div style={{ padding: "18px 16px 13px", borderBottom: "1px solid var(--bd)", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 13 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: "var(--blue)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🌍</div>
              <span style={{ fontSize: 15, fontWeight: 900, letterSpacing: "-.03em" }}>Event<span style={{ color: "var(--blue2)" }}>Scape</span></span>
            </div>
            <div className="card" style={{ display: "flex", alignItems: "center", gap: 9, padding: "9px 11px" }}><div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,var(--blue),#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>{me.role === "professor" ? "👨‍🏫" : "🎓"}</div><div><div style={{ fontSize: 12.5, fontWeight: 700 }}>{me.name}</div><div style={{ fontSize: 10, color: "var(--t3)" }}>{me.role === "professor" ? "교수" : `학생 · ${me.team || ""}`}</div></div></div>
          </div>
          <div style={{ padding: "10px 9px", flex: 1, overflowY: "auto" }} className="scroll">
            <div className="ni on">👤 마이페이지</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 7px 7px" }}><span id="tl" style={{ fontSize: 10, fontWeight: 700, color: "var(--t3)" }}>{me.role === "professor" ? "등록된 팀" : "내 팀 프로젝트"}</span>{me.role !== "professor" ? <button id="atb" onClick={() => addTeam().catch(() => {})} style={{ background: "none", color: "var(--blue2)", fontSize: 11, border: "1px solid var(--bd)" }}>+ 팀 등록</button> : null}</div>
            <div id="tlist">{listTeams.map((t) => <div className="tp" key={t.name}>{t.name}</div>)}</div>
            <div className="divider" />
            <div className="ni" onClick={() => openChat("1on1")}>💬 1:1 채팅</div>
            <div className="ni" onClick={() => openChat("team")}>💬 팀 채팅</div>
          </div>
          <div style={{ padding: "11px 13px", borderTop: "1px solid var(--bd)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 9 }}><div className={`tgl ${isDark ? "" : "on"}`} id="tg" onClick={toggleTheme}><div className="tgk" /></div><span id="tglabel" style={{ fontSize: 12 }}>{isDark ? "다크 모드" : "라이트 모드"}</span></div>
            <button className="btn bg" style={{ width: "100%" }} onClick={logout}>로그아웃</button>
          </div>
        </aside>
        <aside className="sidebar" id="sr">
          <div style={{ padding: "18px 16px 13px", borderBottom: "1px solid var(--bd)" }}><div style={{ fontSize: 13, fontWeight: 800 }}>인기 프로젝트</div></div>
          <div id="rl" style={{ flex: 1, overflowY: "auto", padding: 10 }} className="scroll">
            {ranked.map((ev) => <div key={ev.id} className="ri" onClick={() => openDetail(ev)}><span style={{ fontSize: 15 }}>{(TC[ev.type] || TC.Convention).icon}</span><div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700 }}>{ev.title}</div><div style={{ fontSize: 10.5, color: "var(--t3)" }}>{ev.team_name}</div></div><div>❤️ {ev.votes}</div></div>)}
          </div>
          <div style={{ padding: "12px 13px", borderTop: "1px solid var(--bd)" }}>
            <button className="msb on" onClick={() => setMapStyle("dark")}>🌙 다크</button>
            <button className="msb" onClick={() => setMapStyle("light")}>☀️ 라이트</button>
            <button className="msb" onClick={() => setMapStyle("satellite")}>🛰️ 위성</button>
          </div>
        </aside>
        {currentEvent ? <div id="bc" className="vis" style={{ background: "rgba(13,21,37,.92)", border: "1px solid var(--bd)" }}><div style={{ padding: "16px 18px", display: "flex", gap: 13 }}><div id="bci">{(TC[currentEvent.type] || TC.Convention).icon}</div><div style={{ flex: 1 }}><div id="bcti">{currentEvent.title}</div><div id="bctm">{currentEvent.team_name}</div></div><button className="btn bb" onClick={() => openDetail(currentEvent)}>기획 상세보기</button><button className={`bl ${currentEvent.liked ? "on" : ""}`} onClick={() => toggleLike().catch(() => {})}>❤️ {currentEvent.votes}</button></div></div> : null}
        <div id="pd" className={detailOpen ? "open" : ""}>
          <div style={{ padding: 16, borderBottom: "1px solid var(--bd)", display: "flex", justifyContent: "space-between" }}><span>Project Detail</span><button onClick={closeDetail}>✕</button></div>
          <div id="ds" className="scroll" style={{ flex: 1, padding: 16 }}>
            {currentEvent ? <>
              <h3>{currentEvent.title}</h3>
              <p>{currentEvent.description}</p>
              <div id="fbl">{(currentEvent.feedbacks || []).map((f, i) => <div className={`fb ${f.role === "professor" ? "fb-p" : "fb-s"}`} key={i}><strong>{f.user_name}</strong><p>{f.content}</p></div>)}</div>
            </> : null}
          </div>
          <div style={{ padding: 11, borderTop: "1px solid var(--bd)", display: "flex", gap: 7 }}>
            <input className="fi" value={fb} onChange={(e) => setFb(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addFeedback(fb).then(() => setFb(""))} placeholder="피드백 남기기..." />
            <button className="btn bb" onClick={() => addFeedback(fb).then(() => setFb(""))}>→</button>
          </div>
        </div>
        <div id="cp" className={chatOpen ? "open" : ""}>
          <div style={{ padding: 12, borderBottom: "1px solid var(--bd)", display: "flex", justifyContent: "space-between" }}><span>💬 채팅</span><button onClick={closeChat}>✕</button></div>
          <div id="cv-room" className="scroll" style={{ flex: 1, padding: 11 }}>{chatMessages.map((m, i) => <div className={m.sender_name === me.name ? "co" : "ci"} key={i}><div className={`cm ${m.sender_name === me.name ? "cm-o" : "cm-i"}`}>{m.content}</div></div>)}</div>
          <div id="cinput" style={{ padding: 9, borderTop: "1px solid var(--bd)", display: "flex", gap: 7 }}><input className="fi" value={msg} onChange={(e) => setMsg(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage(msg).then(() => setMsg(""))} /><button className="btn bb" onClick={() => sendMessage(msg).then(() => setMsg(""))}>→</button></div>
        </div>
        <div id="mr" className={registerOpen ? "open" : ""}>
          <div style={{ width: "100%", maxWidth: 500, background: "var(--s1)", border: "1px solid var(--bd)", borderRadius: 24 }}>
            <div style={{ padding: 19, borderBottom: "1px solid var(--bd)", display: "flex", justifyContent: "space-between" }}><div>🚀 MICE 기획 등록</div><button onClick={closeRegister}>✕</button></div>
            <div style={{ padding: 19, display: "flex", flexDirection: "column", gap: 12 }}>
              <input className="fi" placeholder="프로젝트명" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
              <input className="fi" placeholder="팀 이름" value={form.team || mapClickPoint?.team || ""} onChange={(e) => setForm((p) => ({ ...p, team: e.target.value }))} />
              <textarea className="fi" placeholder="기획 내용" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
              <button className="btn bb" onClick={() => saveProject({
                title: form.title,
                team_name: form.team || mapClickPoint?.team || "",
                members: form.members,
                type: form.type,
                field: form.field || "기타",
                loc: form.loc || `${mapClickPoint?.lat || "0"}, ${mapClickPoint?.lng || "0"}`,
                lat: Number(mapClickPoint?.lat || 0),
                lng: Number(mapClickPoint?.lng || 0),
                topic: form.topic,
                description: form.description,
                scale: form.scale || "미정",
              }).then(() => setForm({ title: "", team: "", members: "", type: "Convention", field: "", loc: "", topic: "", description: "", scale: "" }))}>지도에 기획 게시 →</button>
            </div>
          </div>
        </div>
        {me.role !== "professor" ? <header style={{ position: "fixed", top: 0, left: "var(--sw)", right: "var(--rw)", zIndex: 30, padding: "0 18px", height: 60, display: "flex", alignItems: "center", justifyContent: "flex-end", pointerEvents: "none" }}><button id="regbtn" onClick={openRegister} className="btn bb" style={{ pointerEvents: "all", fontSize: 12.5 }}>🚀 기획 등록</button></header> : null}
      </div>
    </div>
  );
}

export default function App() {
  const restoreSession = useAppStore((s) => s.restoreSession);
  const env = useAppStore((s) => s.env);
  const setError = useAppStore((s) => s.setError);
  useEffect(() => {
    if (!env.MB_TOK) setError("Mapbox 토큰(MB_TOK)이 없습니다.");
    if (!env.hasSupabase) setError("Supabase 설정이 없습니다.");
    restoreSession().catch(() => {});
  }, [env, restoreSession, setError]);
  return (
    <>
      <MapView />
      <LoginOverlay />
      <AppShell />
    </>
  );
}

