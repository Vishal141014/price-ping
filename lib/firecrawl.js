import FirecrawlApp from '@mendable/firecrawl-js';

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

export async function scrapeProduct(url) {
    try{
        const result = await firecrawl.scrapeUrl(url, {
            formats: ["extract"],
            extract: {
                schema: {
                    type: "object",
                    required: ["productName", "currentPrice"],
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
                },
            },
        });

        console.log("Firecrawl result:", JSON.stringify(result, null, 2));
        const extractedData = result.extract;

        if(!extractedData || !extractedData.productName){
            console.error("Extraction failed. Result:", result);
            throw new Error("No data extracted from URL");
        }

        console.log("Extracted data:", extractedData);
        return extractedData;

    } catch (error) {
        console.error("Firecrawl scrape error:", error);
        throw new Error(`Failed to scrape product: ${error.message}`);
    }
}