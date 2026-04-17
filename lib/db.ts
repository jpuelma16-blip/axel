import Database from "better-sqlite3";
import { join } from "path";

const DB_PATH = join(process.cwd(), "data", "axel.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const { mkdirSync } = require("fs");
  mkdirSync(join(process.cwd(), "data"), { recursive: true });

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  _db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre      TEXT NOT NULL,
      contacto    TEXT NOT NULL,
      fecha       TEXT NOT NULL,
      hora        TEXT NOT NULL,
      paquete     TEXT NOT NULL,
      descripcion TEXT,
      origen      TEXT,
      destino     TEXT,
      precio      INTEGER NOT NULL,
      estado      TEXT NOT NULL DEFAULT 'pendiente',
      canal       TEXT DEFAULT 'web',
      created_at  TEXT NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS blocked_slots (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT NOT NULL,
      hora  TEXT,
      razon TEXT
    );
  `);

  return _db;
}

// ── Paquetes disponibles ──────────────────────────────────────────────────
export const PAQUETES = [
  {
    id: "basico",
    nombre: "Paquete Básico",
    descripcion: "Hasta 5 kg — documentos, ropa, artículos pequeños",
    precio: 5000,
    tiempo_estimado: "2-4 horas",
  },
  {
    id: "estandar",
    nombre: "Paquete Estándar",
    descripcion: "5–20 kg — cajas medianas, electrodomésticos pequeños",
    precio: 8000,
    tiempo_estimado: "3-5 horas",
  },
  {
    id: "grande",
    nombre: "Paquete Grande",
    descripcion: "20–50 kg — muebles pequeños, equipos, mudanzas parciales",
    precio: 12000,
    tiempo_estimado: "4-6 horas",
  },
  {
    id: "empresarial",
    nombre: "Paquete Empresarial",
    descripcion: "+50 kg o alto volumen — solución personalizada para empresas",
    precio: 0,
    tiempo_estimado: "A coordinar",
  },
] as const;

export type PaqueteId = (typeof PAQUETES)[number]["id"];

// ── Horarios disponibles ─────────────────────────────────────────────────
export const HORARIOS = [
  "09:00", "10:00", "11:00", "12:00",
  "14:00", "15:00", "16:00", "17:00",
];

// ── Helpers ──────────────────────────────────────────────────────────────
export interface Booking {
  id?: number;
  nombre: string;
  contacto: string;
  fecha: string;       // YYYY-MM-DD
  hora: string;        // HH:MM
  paquete: PaqueteId;
  descripcion?: string;
  origen?: string;
  destino?: string;
  precio: number;
  estado?: string;
  canal?: string;
  created_at?: string;
}

export function getAvailableSlots(fecha: string): string[] {
  const db = getDb();
  const booked = db
    .prepare("SELECT hora FROM bookings WHERE fecha = ? AND estado != 'cancelado'")
    .all(fecha)
    .map((r: any) => r.hora);
  const blocked = db
    .prepare("SELECT hora FROM blocked_slots WHERE fecha = ? AND (hora IS NOT NULL)")
    .all(fecha)
    .map((r: any) => r.hora);
  const taken = new Set([...booked, ...blocked]);
  return HORARIOS.filter((h) => !taken.has(h));
}

export function createBooking(booking: Booking): number {
  const db = getDb();
  const result = db
    .prepare(`
      INSERT INTO bookings (nombre, contacto, fecha, hora, paquete, descripcion, origen, destino, precio, canal)
      VALUES (@nombre, @contacto, @fecha, @hora, @paquete, @descripcion, @origen, @destino, @precio, @canal)
    `)
    .run(booking);
  return result.lastInsertRowid as number;
}

export function getBookings(filters?: { fecha?: string; estado?: string }) {
  const db = getDb();
  let query = "SELECT * FROM bookings WHERE 1=1";
  const params: any[] = [];
  if (filters?.fecha) { query += " AND fecha = ?"; params.push(filters.fecha); }
  if (filters?.estado) { query += " AND estado = ?"; params.push(filters.estado); }
  query += " ORDER BY fecha ASC, hora ASC";
  return db.prepare(query).all(...params);
}

export function updateBookingStatus(id: number, estado: string) {
  getDb().prepare("UPDATE bookings SET estado = ? WHERE id = ?").run(estado, id);
}
