# 🏷️ Price Ping

**Never Miss a Price Drop!**

Price Ping is a powerful price tracking application that helps you monitor product prices from any e-commerce website. Get instant alerts when prices drop below your target and save money on your favorite products.

Made with ❤️ by Code Habit Chisiya

## ✨ Features

- **🐰 Lightning Fast** - Extracts prices in seconds, handling JavaScript and dynamic content
- **🛡️ Always Reliable** - Works across all major e-commerce sites with built-in anti-bot protection
- **🔔 Smart Alerts** - Get notified instantly when prices drop below your target
- **🔐 Secure Authentication** - User authentication powered by Supabase
- **📊 Price History** - Track price changes over time
- **🎨 Beautiful UI** - Modern, responsive design with Tailwind CSS

## 🚀 Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) with App Router
- **Language:** JavaScript (React 19)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Authentication & Database:** [Supabase](https://supabase.com/)
- **Web Scraping:** [Firecrawl](https://www.firecrawl.dev/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Notifications:** [Sonner](https://sonner.emilkowal.ski/)

## 📦 Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd price-ping
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables:**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   FIRECRAWL_API_KEY=your_firecrawl_api_key
   ```

4. **Set up Supabase Database:**
   
   Create the following tables in your Supabase project:
   
   **Products Table:**
   ```sql
   CREATE TABLE products (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     url TEXT NOT NULL,
     current_price DECIMAL,
     target_price DECIMAL,
     image_url TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
   );
   ```

   **Price History Table:**
   ```sql
   CREATE TABLE price_history (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     product_id UUID REFERENCES products(id) ON DELETE CASCADE,
     price DECIMAL NOT NULL,
     recorded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
   );
   ```

   **Set up Row Level Security (RLS):**
   ```sql
   -- Enable RLS
   ALTER TABLE products ENABLE ROW LEVEL SECURITY;
   ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

   -- Products policies
   CREATE POLICY "Users can view their own products"
     ON products FOR SELECT
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can insert their own products"
     ON products FOR INSERT
     WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can update their own products"
     ON products FOR UPDATE
     USING (auth.uid() = user_id);

   CREATE POLICY "Users can delete their own products"
     ON products FOR DELETE
     USING (auth.uid() = user_id);

   -- Price history policies
   CREATE POLICY "Users can view price history of their products"
     ON price_history FOR SELECT
     USING (
       EXISTS(
         SELECT 1 FROM products
         WHERE products.id = price_history.product_id
         AND products.user_id = auth.uid()
       )
     );
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser:**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

1. **Sign Up / Sign In** - Create an account or log in using the authentication system
2. **Add a Product** - Paste the URL of any product from an e-commerce site
3. **Set Target Price** - Specify your desired price point
4. **Track & Monitor** - Watch as Price Ping monitors the product for you
5. **Get Alerts** - Receive notifications when the price drops

## 📁 Project Structure

```
price-ping/
├── app/
│   ├── actions.js          # Server actions
│   ├── globals.css         # Global styles
│   ├── layout.js           # Root layout
│   ├── page.jsx            # Home page
│   └── auth/
│       └── callback/       # Auth callback route
├── components/
│   ├── AddProductForm.jsx  # Product addition form
│   ├── AuthButton.jsx      # Authentication button
│   ├── AuthModel.js        # Auth modal
│   └── ui/                 # UI components (shadcn)
├── lib/
│   └── utils.js            # Utility functions
├── utils/
│   └── supabase/           # Supabase client configs
├── public/                 # Static assets
├── proxy.js                # Proxy configuration
└── package.json
```

## 🔧 Configuration

### Tailwind CSS
Tailwind CSS is configured with custom animations and plugins. See `postcss.config.mjs` for PostCSS configuration.

### ESLint
ESLint is configured for Next.js. See `eslint.config.mjs` for linting rules.

## 🚢 Deployment

### Deploy on Vercel

The easiest way to deploy Price Ping is using [Vercel](https://vercel.com):

1. Push your code to GitHub
2. Import your repository to Vercel
3. Add your environment variables
4. Deploy!

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Environment Variables in Production

Make sure to set these environment variables in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `FIRECRAWL_API_KEY`

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Supabase](https://supabase.com/) - The Open Source Firebase Alternative
- [Firecrawl](https://www.firecrawl.dev/) - Web Scraping API
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI Components
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

Made with ❤️ by Code Habit Chisiya
