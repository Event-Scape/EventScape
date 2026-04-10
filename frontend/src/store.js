import { create } from "zustand";
import { createClient } from "@supabase/supabase-js";
import { MB_TOK, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";
import { ROSTER, TC_LIST } from "./demoData";

const sb = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
const isMissingTableError = (error) =>
  !!error && (error.code === "PGRST205" || error.code === "42P01" || error.status === 404);

export const useAppStore = create((set, get) => ({
  me: null,
  events: [],
  teams: [],
  currentEvent: null,
  chatRoom: null,
  chatMessages: [],
  chatOpen: false,
  chatExpanded: false,
  detailOpen: false,
  registerOpen: false,
  isDark: true,
  mapStyle: "dark",
  errorMessage: "",
  mapReady: false,
  mapClickPoint: null,
  env: { MB_TOK, hasSupabase: !!sb },

  setError: (msg) => set({ errorMessage: msg }),
  clearError: () => set({ errorMessage: "" }),
  toggleTheme: () => set((s) => ({ isDark: !s.isDark })),
  setMapStyle: (mapStyle) => set({ mapStyle }),
  setMapReady: (mapReady) => set({ mapReady }),
  setMapClickPoint: (mapClickPoint) => set({ mapClickPoint, registerOpen: !!mapClickPoint }),
  openDetail: (ev) => set({ currentEvent: ev, detailOpen: true }),
  closeDetail: () => set({ detailOpen: false }),
  closeCard: () => set({ currentEvent: null }),
  openRegister: () => set({ registerOpen: true }),
  closeRegister: () => set({ registerOpen: false }),
  toggleChatExpand: () => set((s) => ({ chatExpanded: !s.chatExpanded })),
  closeChat: () => set({ chatOpen: false }),

  login: async (name, uid) => {
    const found = ROSTER.find((u) => u.name === name.trim() && u.uid === uid.trim());
    if (!found) throw new Error("INVALID_CREDENTIALS");
    localStorage.setItem("eventscape_me", JSON.stringify(found));
    set({ me: found, errorMessage: "" });
    await Promise.all([get().loadEvents(), get().loadTeams()]);
  },

  restoreSession: async () => {
    const saved = localStorage.getItem("eventscape_me");
    if (!saved) return;
    const me = JSON.parse(saved);
    set({ me });
    await Promise.all([get().loadEvents(), get().loadTeams()]);
  },

  logout: () => {
    localStorage.removeItem("eventscape_me");
    set({
      me: null,
      currentEvent: null,
      detailOpen: false,
      chatOpen: false,
      registerOpen: false,
      chatMessages: [],
      chatRoom: null,
    });
  },

  loadEvents: async () => {
    if (!sb) return;
    const { me } = get();
    const { data, error } = await sb.from("events").select("*").order("created_at", { ascending: false });
    if (error) {
      if (isMissingTableError(error)) {
        set({
          events: [],
          errorMessage: "Supabase에 `events` 테이블이 없습니다. README의 `supabase/schema.sql`을 먼저 실행해 주세요.",
        });
        return;
      }
      throw error;
    }
    const events = (data || []).map((e) => ({
      ...e,
      feedbacks: e.feedbacks || [],
      files: e.files || [],
      liked_by: e.liked_by || [],
      liked: me ? (e.liked_by || []).includes(me.uid) : false,
      votes: (e.liked_by || []).length,
    }));
    set({ events });
  },

  loadTeams: async () => {
    if (!sb) return;
    const { data, error } = await sb.from("teams").select("*").order("name", { ascending: true });
    if (error) {
      if (isMissingTableError(error)) {
        set({
          teams: [],
          errorMessage: "Supabase에 `teams` 테이블이 없습니다. README의 `supabase/schema.sql`을 먼저 실행해 주세요.",
        });
        return;
      }
      throw error;
    }
    set({ teams: data || [] });
  },

  addTeam: async () => {
    const n = window.prompt("팀 이름을 입력하세요 (예: D팀)");
    if (!n) return;
    const name = n.trim();
    if (!name) return;
    const { teams } = get();
    if (teams.some((t) => t.name === name)) return window.alert("이미 존재하는 팀입니다.");
    const color = TC_LIST[teams.length % TC_LIST.length];
    set({ teams: [...teams, { name, color }] });
    if (sb) await sb.from("teams").insert({ name, color });
  },

  toggleLike: async () => {
    const { currentEvent, me, events } = get();
    if (!currentEvent || !me) return;
    const liked = !currentEvent.liked;
    const before = currentEvent.liked_by || [];
    const liked_by = liked ? [...new Set([...before, me.uid])] : before.filter((x) => x !== me.uid);
    const updated = { ...currentEvent, liked, liked_by, votes: liked_by.length };
    set({
      currentEvent: updated,
      events: events.map((e) => (e.id === updated.id ? updated : e)),
    });
    if (sb) await sb.from("events").update({ liked_by }).eq("id", updated.id);
  },

  addFeedback: async (content) => {
    const { currentEvent, me, events } = get();
    if (!content.trim() || !currentEvent || !me) return;
    const nextFb = { user_name: me.name, role: me.role, content: content.trim(), event_id: currentEvent.id };
    const feedbacks = [...(currentEvent.feedbacks || []), nextFb];
    const updated = { ...currentEvent, feedbacks };
    set({
      currentEvent: updated,
      events: events.map((e) => (e.id === updated.id ? updated : e)),
    });
    if (sb) await sb.from("events").update({ feedbacks }).eq("id", updated.id);
  },

  saveProject: async (payload) => {
    const { events, teams } = get();
    let ev = {
      ...payload,
      files: [],
      feedbacks: [],
      liked_by: [],
      votes: 0,
      liked: false,
    };
    if (sb) {
      const teamColor = teams.find((t) => t.name === payload.team_name)?.color || TC_LIST[teams.length % TC_LIST.length];
      await sb.from("teams").upsert({ name: payload.team_name, color: teamColor }, { onConflict: "name" });
      const { data } = await sb
        .from("events")
        .insert({
          title: payload.title,
          team_name: payload.team_name,
          members: payload.members,
          type: payload.type,
          field: payload.field,
          loc: payload.loc,
          lat: payload.lat,
          lng: payload.lng,
          topic: payload.topic,
          description: payload.description,
          scale: payload.scale,
          files: [],
          feedbacks: [],
          liked_by: [],
        })
        .select("*")
        .single();
      if (data) {
        ev = { ...data, feedbacks: data.feedbacks || [], liked_by: data.liked_by || [], votes: 0, liked: false };
      }
      await get().loadTeams();
    }
    set({ events: [ev, ...events], currentEvent: ev, registerOpen: false });
  },

  openChat: async (type) => {
    const { me, teams } = get();
    if (!me) return;
    const isP = me.role === "professor";
    const room = type === "1on1" ? (isP ? "prof_chat" : `prof_${me.uid}`) : `team_${me.team || teams[0]?.name || "general"}`;
    set({ chatRoom: room, chatOpen: true, chatMessages: [] });
    if (sb) {
      const { data } = await sb
        .from("messages")
        .select("*")
        .eq("room", room)
        .order("created_at", { ascending: true })
        .limit(200);
      set({ chatMessages: data || [] });
    }
  },

  sendMessage: async (txt) => {
    const { chatRoom, me, chatMessages } = get();
    if (!txt.trim() || !chatRoom) return;
    const fallback = { room: chatRoom, sender_id: me?.uid || null, sender_name: me?.name || "익명", content: txt.trim() };
    if (sb) {
      const { data } = await sb.from("messages").insert(fallback).select("*").single();
      set({ chatMessages: [...chatMessages, data || fallback] });
      return;
    }
    set({ chatMessages: [...chatMessages, fallback] });
  },
}));

