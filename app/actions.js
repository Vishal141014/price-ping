'use server'

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache";
import { redirect } from "next/dist/server/api-utils";
import FirecrawlApp from "@mendable/firecrawl-js";

// Initialize Firecrawl
const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

// Function to scrape product data from URL
async function scrapeProduct(url) {
    try {
        const scrapeResult = await firecrawl.scrapeUrl(url, {
            formats: ["extract"],
            extract: {
                schema: {
                    type: "object",
                    properties: {
                        productName: { 
                            type: "string",
                            description: "The name or title of the product"
                        },
                        currentPrice: { 
                            type: "string",
                            description: "The current selling price of the product (numeric value with currency symbol)"
                        },
                        currencyCode: { 
                            type: "string",
                            description: "The currency code like USD, INR, EUR, etc."
                        },
                        productImageUrl: { 
                            type: "string",
                            description: "The main product image URL"
                        },
                    },
                    required: ["productName", "currentPrice"],
                },
            },
        });

        console.log("Firecrawl result:", JSON.stringify(scrapeResult, null, 2));
        return scrapeResult.extract || {};
    } catch (error) {
        console.error("Scraping error:", error);
        throw new Error("Failed to scrape product data");
    }
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/");
    redirect("/");
}

// server action to adding the product to database 
export async function addProduct(formData) {
    const url = formData.get("url");

    if(!url){
        return{ error: "URL is required"};
    }

    try {
        const supabase = await createClient();
        const{
            data: { user},
        } = await supabase.auth.getUser();

        if(!user){
            return{ error: "Not authenticated"};
        }

        // Scrape product data with Firecrawl
        const productData = await scrapeProduct(url);

        console.log("Scraped product data:", productData);

        if(!productData.productName || !productData.currentPrice){
            console.log(productData, "productData - Missing required fields");
            return{ error: "could not extract product information form this URL"};
        }

        // Clean and parse price - remove currency symbols, commas, spaces
        const priceString = productData.currentPrice.toString()
            .replace(/[₹$€£,\s]/g, '') // Remove common currency symbols and commas
            .replace(/[^\d.]/g, '');    // Keep only digits and decimal point
        
        const newPrice = parseFloat(priceString);
        
        console.log("Original price:", productData.currentPrice, "Parsed price:", newPrice);

        // Validate price is a valid number
        if(isNaN(newPrice) || newPrice <= 0){
            console.log("Invalid price after parsing:", newPrice);
            return{ error: "Could not extract valid price from this URL"};
        }

        const currency = productData.currencyCode || "INR";

        const { data: existingProduct } = await supabase
        .from("products")
        .select("id, current_price")
        .eq("user_id", user.id)
        .eq("url", url)
        .single();

        const isUpdate = !!existingProduct;

        // Upsert product (insert or update based on user_id + url)
        const { data:product, error } = await supabase.from("products").upsert({
            user_id: user.id,
            url,
            name: productData.productName,
            current_price: newPrice,
            currency: currency,
            image_url: productData.productImageUrl,
            updated_at: new Date().toISOString(),
        },{
            onConflict: "user_id, url", // Unique constraint on user_id + url
            ignoreDuplicates: false, // Always update if exists
        })
        .select()
        .single();

        if(error) throw error;

        // Add to price history if it's a new product OR price changed
        const shouldAddHistory = !isUpdate || existingProduct.current_price !== newPrice;

        if(shouldAddHistory){
            await supabase.from("price_history").insert({
                product_id: product.id,
                price: newPrice,
                currency: currency,
            });
        }

        revalidatePath("/");

        return{
            success: true,
            product,
            message: isUpdate ? "product updated with latest price" : "product added successfully",
        };
    } catch (error) {
        console.error("Add product error:", error);
        return { error: error.message || "Failed to add product" };
    }
}

export async function deleteProduct(productId) {
    try {
        const supabase = await createClient();

        const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", productId);

        if(error) throw error;

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        return { error: error.message };
    }
}

export async function getProducts() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

        if(error) throw error;

        return data || [];
    } catch (error) {
         console.error("Get product error:", error);
        return [];
    }
}

export async function getPriceHistory(productId) {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
        .from("price_history")
        .select("*")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });

        if(error) throw error;

        return data || [];
    } catch (error) {
         console.error("Get product error:", error);
        return [];
    }
}