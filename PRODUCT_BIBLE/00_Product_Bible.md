# PT Client Management System — Product Bible

## Version
**1.0 MVP**

## Product Name
**PT Client Management System**

---

## Description

PT Client Management System adalah aplikasi berbasis web yang dirancang untuk membantu **Personal Trainer (PT)** mengelola seluruh aktivitas client mulai dari:

- Penjualan paket sesi
- Pengelolaan latihan
- Pencatatan perkembangan tubuh
- Nutrisi
- Analitik performa

...dalam **satu platform terintegrasi**.

---

## Role Based Access Control (RBAC)

| Role | Deskripsi |
|---|---|
| **Super Admin** | Mengelola seluruh sistem, semua PT, semua client |
| **Personal Trainer** | Mengelola client miliknya, menjual paket, workout |
| **Client** | Melihat data sendiri, input nutrisi, tracking progress |

> **Penting**: Semua transaksi di dalam sistem hanya berasal dari penjualan paket sesi Personal Trainer, **bukan** membership gym.

---

## Vision

> Membangun platform digital yang menjadi **operating system** bagi Personal Trainer dalam mengelola bisnis dan perkembangan client secara profesional.

## Core Values

| Value | Penjelasan |
|---|---|
| **Simple** | UI yang bersih dan mudah digunakan |
| **Fast** | Response time cepat, optimasi performa |
| **Professional** | Tampilan premium, data akurat |
| **Scalable** | Arsitektur yang bisa berkembang |
| **Mobile First** | Didesain untuk mobile browser |
| **Data Driven** | Keputusan berbasis data nyata |

---

## Target Platform

- ✅ Desktop Web
- ✅ Tablet Browser
- ✅ Mobile Browser
- ✅ Progressive Web App (PWA)
- 🔮 Future: Mobile Apps (React Native)
- 🔮 Future: AI Coach, AI Nutrition, AI Workout Builder

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 15 + React 19 + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| ORM | Drizzle ORM |
| State Management | Zustand + TanStack Query |
| Form | React Hook Form + Zod |
| Chart | Recharts |
| Calendar | FullCalendar |
| Table | TanStack Table |
| Deployment | Vercel + Supabase |
