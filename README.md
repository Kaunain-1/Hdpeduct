# Hdpeduct Website

The website is a Vite-built static frontend. Supabase provides shared product/site data and administrator authentication; no application server is needed at runtime.

## Configure Supabase

1. In your Supabase project, open **Project Settings → API** and copy the project URL and **anon/public** key. Never use the `service_role` key in this frontend.
2. Copy `.env.example` to `.env.local` and set:

   ```dotenv
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-public-anon-key
   ```

   These are build-time values. The anon key is delivered to the browser and is not a secret; secure data writes with Supabase Auth and the supplied row-level security policies. Do not commit `.env.local`.
3. In the Supabase SQL Editor, run [`supabase/migrations/20261110000000_site_data.sql`](./supabase/migrations/20261110000000_site_data.sql).
4. In **Authentication → Users**, create the administrator account using the admin's email and password. Copy that user's UUID and register it in the admin allowlist, replacing the placeholder:

   ```sql
   insert into public.admin_users (user_id)
   values ('AUTH_USER_UUID');
   ```

   Only users in `admin_users` can change products or site content. Visitors can read the public catalogue and site content.
5. Install dependencies and run the local development build:

   ```powershell
   npm install
   npm run dev
   ```

The admin signs in with the Supabase Auth email and password. **Website Editor → Site Data** can update the authenticated account password and manage the optional Cloudinary upload preset. Product, category, partner, homepage-slide, sales, and Cloudinary settings are stored in Supabase; successful edits appear in the catalogue immediately.

## Build and static hosting

Run `npm run build` to generate `dist/`, then deploy that folder to a static host. Configure `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build environment variables on the host. The values are embedded into the browser bundle at build time; rebuilding is required after changing them.

Products and images from the previous browser-only version are not migrated automatically. Before switching, export the site data from the old version and import it after Supabase is configured and an administrator is signed in.

## Security notes

- The Supabase anon key is public by design. Never include a Supabase `service_role` key in frontend code or environment variables prefixed with `VITE_`.
- Apply the SQL migration and add only trusted Auth user UUIDs to `admin_users`. Row-level security lets anyone read the public website data but limits writes to authorized accounts.
- Cloudinary unsigned upload presets are public. Restrict allowed formats, size, and folder in Cloudinary; do not put an API secret in this site.
- Contact and product inquiry forms open the visitor's email application.
