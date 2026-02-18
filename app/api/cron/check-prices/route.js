import { sendPriceDropAlert } from "@/lib/email";
import { scrapeProduct } from "@/lib/firecrawl";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Price check endpoint is working. Use POST to trigger.",
  });
}

export async function POST(request) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*");

    if (productsError) throw productsError;

    console.log(`Found ${products.length} products to check`);

    const result = {
      total: products.length,
      updated: 0,
      failed: 0,
      priceChange: 0,
      alertSent: 0,
    };

    for (const product of products) {
      try {
        console.log(`\nChecking product: ${product.name} (${product.url})`);
        const productData = await scrapeProduct(product.url);
        console.log("Scraped data:", productData);

        if (!productData.currentPrice) {
          console.log("No price found for product:", product.id);
          result.failed++;
          continue;
        }

        // Clean and parse price - remove currency symbols, commas, spaces
        const priceString = productData.currentPrice.toString()
            .replace(/[₹$€£,\s]/g, '') // Remove common currency symbols and commas
            .replace(/[^\d.]/g, '');    // Keep only digits and decimal point
        
        const newPrice = parseFloat(priceString);
        const oldPrice = parseFloat(product.current_price);

        await supabase
          .from("products")
          .update({
            current_price: newPrice,
            currency: productData.currencyCode || product.currency,
            image_url: productData.productImageUrl || product.image_url,
            updated_at: new Date().toISOString(),
          })
          .eq("id", product.id);

        if (oldPrice !== newPrice) {
          await supabase.from("price_history").insert({
            product_id: product.id,
            price: newPrice,
            currency: productData.currencyCode || product.currency,
          });

          result.priceChange++;

          // Alert user
          if (newPrice < oldPrice) {
            const {
              data: { user },
            } = await supabase.auth.admin.getUserById(product.user_id);

            // send email
            if (user?.email) {
                const emailResult = await sendPriceDropAlert(
                    user.email,
                    product,
                    oldPrice,
                    newPrice
                );

                if(emailResult.success){
                    result.alertSent++;
                }
            }
          }
        }

        result.updated++;
        console.log(`✓ Successfully updated product ${product.id}`);
      } catch (error) {
        console.error(`✗ Error processing product ${product.id}:`, error.message);
        result.failed++;
      }
    }

    return NextResponse.json({
      success: true,
      message: "Price check completed",
      result,
    });
  } catch (error) {
    console.error("Cron job error: ", error);
    return NextResponse.json(
      {
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }
}

// curl.exe -X POST https://getprice-ping.vercel.app/api/cron/check-prices -H "Authorization: Bearer aca94871ed480912225f41293fb24c6540716d646b6d8e21d040738027fbb13e"
