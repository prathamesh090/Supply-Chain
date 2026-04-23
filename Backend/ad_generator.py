import sys
import os
import json
import logging
import base64
import requests
import time
import io
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException

# Add the current directory to sys.path to ensure local modules are found
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from Supplier_Portal_Dashboard.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ads", tags=["advertisements"])

# Using Freepik AI (Mystic) for image generation
FREEPIK_API_URL = "https://api.freepik.com/v1/ai/mystic"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

logger.info("🚀 AD GENERATOR MODULE RELOADED - VERSION: FREEPIK MYSTIC")


class AdRequest:
    def __init__(
        self,
        business_name: str,
        products: str,
        target_audience: str = "",
        location: str = "",
        usp: str = "",
        offer: str = "",
        contact: str = "",
        platform: str = "instagram",
        tone: str = "modern",
    ):
        self.business_name = business_name
        self.products = products
        self.target_audience = target_audience
        self.location = location
        self.usp = usp
        self.offer = offer
        self.contact = contact
        self.platform = platform
        self.tone = tone


def generate_advertisement(ad_req: AdRequest) -> dict:
    """Generate advertisement copy using Groq API"""
    if not settings.GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not configured")

    prompt = f"""You are an AI advertisement creator for a plastic products manufacturer.

Business Name: {ad_req.business_name}
Products: {ad_req.products}
Target Audience: {ad_req.target_audience or 'Retail customers and businesses'}
Location: {ad_req.location}
USP / Strengths: {ad_req.usp}
Offer: {ad_req.offer or 'Limited Stock Available'}
Contact: {ad_req.contact}
Platform: {ad_req.platform}
Tone: {ad_req.tone}

Generate a complete advertisement in this exact JSON format ONLY (no markdown, no extra text):
{{
  "headline": "A catchy headline under 10 words",
  "shortCaption": "1-2 line caption for Instagram/WhatsApp",
  "longCaption": "Longer paragraph for Facebook/LinkedIn with benefits and trust factors",
  "cta": "Call-to-action like 'Call Now' or 'Order Today'",
  "textForAd": ["Line 1", "Line 2", "Line 3", "Line 4"],
  "visualRecommendation": "Detailed visual style and image recommendations",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "bestFormat": "Recommended format (Instagram post/reel, Facebook post/ad, LinkedIn post, WhatsApp status, YouTube Shorts)"
}}"""

    try:
        response = requests.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "max_tokens": 2000,
            },
            timeout=30,
        )

        if response.status_code != 200:
            raise ValueError(f"Groq API returned {response.status_code}: {response.text}")

        data = response.json()
        if not data.get("choices") or not data["choices"][0].get("message"):
            raise ValueError("Invalid response structure from Groq API")

        content = data["choices"][0]["message"]["content"]

        try:
            result = json.loads(content)
        except json.JSONDecodeError:
            json_start = content.find("{")
            json_end = content.rfind("}") + 1
            if json_start != -1 and json_end > json_start:
                result = json.loads(content[json_start:json_end])
            else:
                raise ValueError("Could not parse JSON from Groq response")

        return result

    except requests.exceptions.Timeout:
        raise ValueError("Request to Groq API timed out")
    except requests.exceptions.ConnectionError:
        raise ValueError("Connection error to Groq API")
    except Exception as e:
        logger.error(f"Error generating ad: {str(e)}")
        raise


def generate_ad_image_freepik(prompt: str) -> str:
    """Generate ad image using Freepik AI (Mystic) with polling"""
    if not settings.FREEPIK_API_KEY:
        raise ValueError("FREEPIK_API_KEY not configured")

    headers = {
        "x-freepik-api-key": settings.FREEPIK_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }
    
    payload = {
        "prompt": prompt,
        "aspect_ratio": "widescreen_16_9"
    }

    try:
        # 1. Trigger the generation task
        response = requests.post(FREEPIK_API_URL, headers=headers, json=payload, timeout=40)
        
        if response.status_code != 200:
            error_text = response.text
            logger.error(f"Freepik API error (start): {response.status_code} - {error_text}")
            raise ValueError(f"Freepik API returned {response.status_code}: {error_text}")

        task_data = response.json()
        task_id = task_data.get("data", {}).get("task_id")
        
        if not task_id:
            # Maybe it's synchronous? Check for data directly
            generated = task_data.get("data", {}).get("generated", [])
            if generated:
                img_url = generated[0]
                img_resp = requests.get(img_url, timeout=30)
                if img_resp.status_code == 200:
                    return base64.b64encode(img_resp.content).decode('utf-8')
            
            logger.error(f"No task_id or sync data in Freepik response: {task_data}")
            raise ValueError("Failed to start generation task on Freepik")

        # 2. Poll for the result (max 60 seconds)
        polling_url = f"{FREEPIK_API_URL}/{task_id}"
        logger.info(f"Polling Freepik Mystic task {task_id}...")
        
        for _ in range(30): # 30 retries * 2 seconds = 60s
            time.sleep(2)
            poll_resp = requests.get(polling_url, headers=headers, timeout=20)
            
            if poll_resp.status_code != 200:
                continue
                
            result = poll_resp.json()
            data_content = result.get("data", {})
            
            if isinstance(data_content, dict):
                status = data_content.get("status")
                if status == "COMPLETED":
                    generated = data_content.get("generated", [])
                    if isinstance(generated, list) and len(generated) > 0:
                        image_url = generated[0]
                        # Download the image and convert to base64
                        img_resp = requests.get(image_url, timeout=30)
                        if img_resp.status_code == 200:
                            return base64.b64encode(img_resp.content).decode('utf-8')
                        else:
                            raise ValueError(f"Failed to download generated image from {image_url}")
                
                if status == "FAILED":
                    error_info = data_content.get("error", "Unknown error")
                    raise ValueError(f"Freepik task failed: {error_info}")

        raise ValueError("Freepik image generation timed out after 60 seconds")

    except requests.exceptions.Timeout:
        raise ValueError("Freepik request timed out")
    except Exception as e:
        logger.error(f"Error generating image with Freepik: {str(e)}")
        raise


def overlay_ad_text(image_b64: str, ad_data: dict, business_name: str) -> str:
    """Overlay Canva-style ad copy text onto the image"""
    try:
        # Decode base64 image
        image_data = base64.b64decode(image_b64)
        img = Image.open(io.BytesIO(image_data)).convert("RGBA")
        width, height = img.size
        
        # Create a drawing context
        overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)
        
        # 1. Canva-style Gradient Overlay (Bottom-up)
        for i in range(int(height * 0.4)):
            alpha = int(200 * (1 - i / (height * 0.4)))
            draw.line([(0, height - i), (width, height - i)], fill=(0, 0, 0, alpha))
        
        # 2. Setup Fonts
        try:
            font_path = "C:/Windows/Fonts/arialbd.ttf"
            font_path_reg = "C:/Windows/Fonts/arial.ttf"
            h_size = int(height * 0.055)
            c_size = int(height * 0.032)
            b_size = int(height * 0.028)
            
            headline_font = ImageFont.truetype(font_path, h_size)
            caption_font = ImageFont.truetype(font_path_reg, c_size)
            brand_font = ImageFont.truetype(font_path, b_size)
            cta_font = ImageFont.truetype(font_path, int(height * 0.025))
        except:
            headline_font = ImageFont.load_default()
            caption_font = ImageFont.load_default()
            brand_font = ImageFont.load_default()
            cta_font = ImageFont.load_default()
            
        headline = ad_data.get("headline", "Premium Quality").upper()
        caption = ad_data.get("shortCaption", "The best choice for your business.")
        cta_text = ad_data.get("cta", "ORDER NOW").upper()
        
        # 3. Draw Stylish Brand Header
        header_bar_h = int(height * 0.06)
        draw.rectangle([0, 0, width, header_bar_h], fill=(0, 0, 0, 100))
        draw.text((30, 15), business_name.upper(), font=brand_font, fill=(0, 255, 255, 255))
        
        # 4. Draw Headline (Left Aligned with Padding)
        padding = 40
        draw.text((padding, height - int(height * 0.22)), headline, font=headline_font, fill=(255, 255, 255, 255))
        
        # 5. Draw Caption
        draw.text((padding, height - int(height * 0.22) + h_size + 10), caption, font=caption_font, fill=(240, 240, 240, 255))
        
        # 6. Draw CTA Button (Bottom Right)
        cta_w = int(width * 0.22)
        cta_h = int(height * 0.07)
        cta_x = width - cta_w - padding
        cta_y = height - cta_h - padding
        
        # Rounded Button (approximated with ellipse/rectangle)
        draw.rounded_rectangle([cta_x, cta_y, cta_x + cta_w, cta_y + cta_h], radius=15, fill=(0, 123, 255, 255))
        
        # Center text in button
        draw.text((cta_x + 20, cta_y + 15), cta_text, font=cta_font, fill=(255, 255, 255, 255))
        
        # Merge and Encode
        combined = Image.alpha_composite(img, overlay).convert("RGB")
        buffered = io.BytesIO()
        combined.save(buffered, format="PNG")
        return base64.b64encode(buffered.getvalue()).decode('utf-8')
        
    except Exception as e:
        logger.error(f"Error overlaying Canva-style text: {str(e)}")
        return image_b64


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/generate")
async def generate_ad(
    business_name: str,
    products: str,
    target_audience: str = "",
    location: str = "",
    usp: str = "",
    offer: str = "",
    contact: str = "",
    platform: str = "instagram",
    tone: str = "modern",
):
    """Generate advertisement copy (text) for a plastic manufacturer using Groq"""
    try:
        if not business_name or not products:
            raise HTTPException(status_code=400, detail="Business name and products are required")

        ad_request = AdRequest(
            business_name=business_name,
            products=products,
            target_audience=target_audience,
            location=location,
            usp=usp,
            offer=offer,
            contact=contact,
            platform=platform,
            tone=tone,
        )

        result = generate_advertisement(ad_request)
        return {"success": True, "data": result}

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating advertisement: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating advertisement. Please try again.")


@router.post("/generate-image")
async def generate_ad_image(
    business_name: str,
    products: str,
    visual_style: str = "modern product photography",
    platform: str = "instagram",
    tone: str = "professional",
):
    """Generate an advertisement image using Gemini 3 Pro Image (Nano Banana Pro)"""
    try:
        if not business_name or not products:
            raise HTTPException(status_code=400, detail="Business name and products are required")

        # 1. Generate Ad Copy first (to get text for overlay)
        ad_request = AdRequest(
            business_name=business_name,
            products=products,
            platform=platform,
            tone=tone
        )
        try:
            ad_data = generate_advertisement(ad_request)
        except Exception as e:
            logger.error(f"Failed to generate ad copy for image: {e}")
            ad_data = {"headline": business_name, "shortCaption": products}

        # 2. Canva-style prompt for a high-end marketing aesthetic
        image_prompt = (
            f"High-end Canva style marketing poster for {business_name}. "
            f"Featuring {products} in a clean, minimalist professional studio setting. "
            f"Modern graphic design layout, plenty of clean negative space for text, "
            "aspirational mood, high-contrast aesthetics, 8k resolution commercial photography."
        )

        # 3. Generate the Base Image
        image_b64 = generate_ad_image_freepik(image_prompt)
        
        # 4. Overlay Text (The "Proper Advertisement" part)
        final_image_b64 = overlay_ad_text(image_b64, ad_data, business_name)
        
        return {
            "success": True,
            "image_base64": final_image_b64,
            "mime_type": "image/png",
            "prompt_used": image_prompt,
            "ad_copy": ad_data # Return copy as well
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error generating ad image: {str(e)}")
        raise HTTPException(status_code=500, detail="Error generating image. Please try again.")



# ═══════════════════════════════════════════════════════════════════
#  HYBRID CHATBOT ENGINE  (DB → Knowledge Base → Groq fallback)
# ═══════════════════════════════════════════════════════════════════

import mysql.connector as _mysql

def _chat_db_conn():
    """Return a DB connection for the chatbot (read-only queries)."""
    try:
        return _mysql.connect(
            host=settings.DB_HOST,
            user=settings.DB_USER,
            password=settings.DB_PASSWORD,
            database=settings.DB_NAME,
            port=settings.DB_PORT,
            connection_timeout=5,
        )
    except Exception:
        return None


# ── Intent keywords ────────────────────────────────────────────────
_INTENT_PATTERNS = {
    "inventory": [
        "stock", "inventory", "warehouse", "product", "units", "quantity",
        "available", "reorder", "lead time", "safety stock", "current stock",
        "low stock", "out of stock", "how much", "how many", "storage",
    ],
    "supplier": [
        "supplier", "vendor", "partner", "connected supplier", "material",
        "sourcing", "procurement", "find supplier", "supplier list",
        "who supplies", "which supplier",
    ],
    "risk": [
        "risk", "defect", "delay", "compliance", "trust score", "risk score",
        "supplier risk", "performance", "reliability", "quality issue",
        "late delivery", "risky",
    ],
    "demand": [
        "demand", "forecast", "forecasting", "prediction", "future demand",
        "trend", "seasonal", "xgboost", "ml model", "predict",
    ],
    "route": [
        "route", "routing", "optimization", "delivery", "shipment",
        "logistics", "transport", "distance", "shortest path", "cost route",
    ],
}

# ── SCM Knowledge Base ─────────────────────────────────────────────
_KB: dict = {
    "safety stock": (
        "📦 **Safety Stock** is a buffer inventory held to protect against demand variability and supply uncertainty.\n"
        "**Formula:** Safety Stock = Z × σ_demand × √Lead Time\n"
        "Where Z = service-level factor (1.65 for 95%, 2.33 for 99%).\n"
        "Higher safety stock = fewer stockouts, but higher holding costs. "
        "Set it based on how critical the product is and how volatile demand is."
    ),
    "reorder point": (
        "🔁 **Reorder Point (ROP)** = (Average Daily Demand × Lead Time) + Safety Stock.\n"
        "When inventory drops to this level, place a new order immediately.\n"
        "**Example:** Daily demand = 50 units, lead time = 7 days, safety stock = 100 → ROP = (50×7)+100 = **450 units**.\n"
        "Your Inventory Management page tracks stock levels against ROP automatically."
    ),
    "eoq": (
        "📐 **Economic Order Quantity (EOQ)** = √(2DS / H)\n"
        "D = Annual demand, S = Order cost per order, H = Holding cost per unit/year.\n"
        "EOQ finds the order size that minimises total inventory cost (ordering + holding).\n"
        "Ordering too little = high frequency costs. Ordering too much = high holding costs. EOQ balances both."
    ),
    "bullwhip effect": (
        "🌊 **Bullwhip Effect** — small demand changes at retail cause huge order swings upstream.\n"
        "**Causes:** Demand forecast errors, order batching, price fluctuations, shortage gaming.\n"
        "**Fixes:** Share real-time POS data upstream, reduce batch sizes, stable pricing, shorten lead times.\n"
        "In plastic manufacturing, this commonly causes raw-material over-ordering during peak seasons."
    ),
    "demand forecasting": (
        "📈 **Demand Forecasting** predicts future customer demand using historical data + external signals.\n"
        "**Methods:** Moving Average → Exponential Smoothing → ARIMA → ML (XGBoost).\n"
        "Your platform uses **XGBoost models** trained on plastic product demand patterns.\n"
        "Good forecasting reduces both excess inventory and stockouts — directly cutting costs."
    ),
    "supplier evaluation": (
        "⭐ **Supplier Evaluation Criteria:**\n"
        "1. Quality (defect rate < 2%)\n"
        "2. On-time delivery rate\n"
        "3. Price consistency (variance < 5%)\n"
        "4. Compliance certifications (ISO, BIS)\n"
        "5. Responsiveness & communication\n"
        "6. Financial stability\n"
        "Your **Supplier Risk module** scores all connected suppliers on these factors automatically."
    ),
    "lead time": (
        "⏱️ **Lead Time** = time from placing an order to receiving goods.\n"
        "Includes: Supplier processing + Production + Shipping + Receiving.\n"
        "**Reduce lead time by:** Local sourcing, pre-negotiated SLAs, safety stock buffers, multi-sourcing.\n"
        "In the Indian plastic supply chain, monsoon months often add 5-10 days to lead times."
    ),
    "supply chain cost": (
        "💰 **Ways to reduce supply chain costs:**\n"
        "1. Negotiate volume discounts with top suppliers\n"
        "2. Optimise order quantities using EOQ\n"
        "3. Use demand forecasting to avoid overstock / stockouts\n"
        "4. Consolidate shipments to reduce freight\n"
        "5. Eliminate high-risk suppliers (use your risk scores!)\n"
        "6. Switch to local suppliers to reduce lead time and transport cost"
    ),
    "just in time": (
        "⚡ **Just-In-Time (JIT)** — materials arrive exactly when needed, minimising inventory holding.\n"
        "✅ Benefits: Lower holding costs, reduced waste, lean operations.\n"
        "❌ Risks: Vulnerable to supply disruptions (zero buffer).\n"
        "Best paired with reliable suppliers and accurate demand forecasting. "
        "Not ideal for plastic raw materials with volatile pricing — maintain at least 2-3 weeks buffer."
    ),
    "route optimization": (
        "🗺️ **Route Optimization** finds the lowest-cost or fastest delivery path.\n"
        "Considers: Distance, delivery windows, vehicle capacity, fuel cost, multi-stop efficiency.\n"
        "Your platform's **Route Optimization module** calculates optimal supplier→warehouse routes.\n"
        "Consolidating deliveries from nearby suppliers can cut logistics costs by 15-30%."
    ),
    "abc analysis": (
        "🔤 **ABC Analysis** classifies inventory by value impact:\n"
        "• **A items** (top 10-20% of SKUs → 70-80% of value): Tight control, frequent reviews\n"
        "• **B items**: Moderate control, periodic reviews\n"
        "• **C items** (50% of SKUs → 5% of value): Simple min-max rules\n"
        "Apply strict reorder discipline to A items; automate C items."
    ),
    "inventory turnover": (
        "🔄 **Inventory Turnover** = COGS ÷ Average Inventory.\n"
        "High turnover = less cash tied up in stock = efficient.\n"
        "Low turnover = overstocking or slow sales = cash drain.\n"
        "Target: **6-12× per year** for plastic manufacturing.\n"
        "Identify slow-moving products in your Inventory page and consider liquidating or re-forecasting."
    ),
    "plastic supply chain": (
        "🏭 **Plastic Manufacturing Supply Chain in India:**\n"
        "Key raw materials: PP, HDPE, LDPE, PVC, ABS (all petrochemical derivatives).\n"
        "**Key risks:** Crude oil price volatility, monsoon disruptions to factories, "
        "BIS/ISO compliance requirements, port congestion at JNPT Mumbai.\n"
        "Use your supplier risk module to monitor for price variance and compliance gaps."
    ),
    "kpi": (
        "📊 **Key Supply Chain KPIs to track:**\n"
        "1. On-Time Delivery Rate (target > 95%)\n"
        "2. Fill Rate (target > 98%)\n"
        "3. Inventory Turnover (6-12× per year)\n"
        "4. Supplier Defect Rate (< 2%)\n"
        "5. Order Cycle Time\n"
        "6. Supply Chain Cost as % of Revenue\n"
        "Your dashboard tracks supplier risk and inventory — these directly impact most of these KPIs."
    ),
    "procurement": (
        "🛒 **Procurement Best Practices:**\n"
        "1. Dual-source critical materials (never single-source)\n"
        "2. Use long-term contracts for price stability (plastic resin prices fluctuate 20-40%/year)\n"
        "3. Set supplier SLAs with penalty clauses\n"
        "4. Run quarterly supplier scorecards\n"
        "5. Leverage demand forecasts to pre-negotiate volumes\n"
        "6. Audit high-risk suppliers annually"
    ),
}

# keyword → KB key mapping
_KB_TRIGGERS: list = [
    (["safety stock", "buffer stock"],              "safety stock"),
    (["reorder point", "rop", "when to order", "reorder"],         "reorder point"),
    (["eoq", "economic order quantity", "order quantity"],          "eoq"),
    (["bullwhip", "demand amplification"],          "bullwhip effect"),
    (["forecast", "forecasting", "predict demand", "demand plan"],  "demand forecasting"),
    (["evaluate supplier", "supplier evaluation", "assess supplier",
      "good supplier", "choose supplier", "select supplier"],       "supplier evaluation"),
    (["lead time", "leadtime", "delivery time"],    "lead time"),
    (["reduce cost", "cut cost", "save cost", "lower cost",
      "supply chain cost", "cost reduction", "cheaper"],            "supply chain cost"),
    (["just in time", "jit", "lean inventory"],     "just in time"),
    (["route optim", "delivery route", "best route",
      "route planning", "optimize route"],          "route optimization"),
    (["abc analysis", "abc classif", "abc inventory"],              "abc analysis"),
    (["inventory turnover", "stock turnover", "stock rotation"],    "inventory turnover"),
    (["plastic", "pp resin", "hdpe", "ldpe", "pvc", "abs resin"],  "plastic supply chain"),
    (["kpi", "key performance", "metrics", "measure performance"],  "kpi"),
    (["procurement", "purchase", "buying strategy", "vendor management"], "procurement"),
]


def _detect_intent(query: str) -> str:
    q = query.lower()
    scores = {intent: sum(1 for kw in kws if kw in q)
              for intent, kws in _INTENT_PATTERNS.items()}
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "unknown"


def _match_kb(query: str) -> Optional[str]:
    q = query.lower()
    for triggers, kb_key in _KB_TRIGGERS:
        if any(t in q for t in triggers):
            return _KB[kb_key]
    return None


# ── DB answer functions ────────────────────────────────────────────

def _db_inventory(query: str) -> Optional[str]:
    conn = _chat_db_conn()
    if not conn:
        return None
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT im.product_id, im.current_stock, im.lead_time,
                   im.supplier_name, im.supplier_location,
                   w.name AS warehouse_name, w.city, w.total_capacity
            FROM inventory_master im
            JOIN warehouses w ON w.warehouse_id = im.warehouse_id
            ORDER BY im.current_stock ASC
        """)
        rows = cur.fetchall()
        if not rows:
            return ("Your inventory database is currently empty. "
                    "Add products via the **Inventory Management** page.")

        q = query.lower()
        # Specific product mentioned?
        for row in rows:
            if row["product_id"].lower() in q:
                return (
                    f"📦 **{row['product_id']}** at {row['warehouse_name']} ({row['city']}): "
                    f"**{row['current_stock']} units** in stock | "
                    f"Lead time: {row['lead_time']} days | "
                    f"Supplier: {row['supplier_name'] or 'Not set'}"
                )

        low_stock = [r for r in rows if r["current_stock"] < 100]
        warehouses: dict = {}
        for r in rows:
            wh = r["warehouse_name"]
            warehouses.setdefault(wh, {"city": r["city"], "capacity": r["total_capacity"], "count": 0, "total": 0})
            warehouses[wh]["count"] += 1
            warehouses[wh]["total"] += r["current_stock"]

        # Low-stock / reorder question
        if any(w in q for w in ["low", "critical", "shortage", "running out", "reorder", "alert"]):
            if low_stock:
                items = ", ".join(f"{r['product_id']} ({r['current_stock']} units)" for r in low_stock[:5])
                return (f"⚠️ **{len(low_stock)} low-stock item(s)** (< 100 units): {items}.\n"
                        f"Consider reordering these immediately to avoid stockouts.")
            return "✅ All products are well-stocked — no items below the 100-unit threshold."

        # General inventory summary
        wh_lines = "\n".join(
            f"  • {name} ({info['city']}): {info['count']} SKUs, {info['total']:,} total units"
            for name, info in warehouses.items()
        )
        return (
            f"📦 **Inventory Summary** — {len(rows)} records across {len(warehouses)} warehouse(s):\n"
            f"{wh_lines}\n"
            f"{'⚠️ ' + str(len(low_stock)) + ' item(s) need reordering.' if low_stock else '✅ Stock levels look healthy overall.'}"
        )
    except Exception as e:
        logger.warning(f"[Chat/inventory] DB query failed: {e}")
        return None
    finally:
        cur.close()
        conn.close()


def _db_suppliers(query: str) -> Optional[str]:
    conn = _chat_db_conn()
    if not conn:
        return None
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT sp.company_legal_name, sp.city, sp.manufacturing_state,
                   sp.country, sp.categories,
                   COALESCE(sc.status, 'none') AS connection_status
            FROM supplier_profiles sp
            LEFT JOIN supplier_connections sc ON sc.supplier_id = sp.supplier_id
            ORDER BY sp.company_legal_name
            LIMIT 20
        """)
        rows = cur.fetchall()
        if not rows:
            return ("No suppliers found in the database yet. "
                    "Visit the **Supplier Discovery** page to connect with suppliers.")

        active = [r for r in rows if r["connection_status"] == "active"]
        q = query.lower()

        # Category / material search
        if any(w in q for w in ["plastic", "pp", "hdpe", "ldpe", "pvc"]):
            matched = [r for r in rows if r.get("categories") and
                       any(m in (r["categories"] or "").lower()
                           for m in ["plastic", "pp", "hdpe", "ldpe", "pvc"])]
            if matched:
                names = ", ".join(r["company_legal_name"] for r in matched[:5])
                return (f"🏭 **{len(matched)} plastic material supplier(s)**: {names}.\n"
                        f"Check the Supplier Discovery page for full details and connection status.")

        if active:
            names = ", ".join(r["company_legal_name"] for r in active[:5])
            extra = f" and {len(active)-5} more" if len(active) > 5 else ""
            return (
                f"🤝 **{len(active)} active connected supplier(s)**: {names}{extra}.\n"
                f"Total **{len(rows)}** suppliers in your network. "
                f"Visit **Supplier Risk** to monitor their performance scores."
            )
        names = ", ".join(r["company_legal_name"] for r in rows[:5])
        return (
            f"📋 **{len(rows)} suppliers** in database (none connected yet): {names}.\n"
            f"Visit **Supplier Discovery** to send connection requests."
        )
    except Exception as e:
        logger.warning(f"[Chat/supplier] DB query failed: {e}")
        return None
    finally:
        cur.close()
        conn.close()


def _db_risk(query: str) -> Optional[str]:
    conn = _chat_db_conn()
    if not conn:
        return None
    try:
        cur = conn.cursor(dictionary=True)
        cur.execute("""
            SELECT sp.company_legal_name, ri.trust_score,
                   ri.defect_rate_pct, ri.delivery_delay_days,
                   ri.compliance, ri.plastic_type
            FROM supplier_risk_inputs ri
            JOIN supplier_profiles sp ON sp.supplier_id = ri.supplier_id
            ORDER BY ri.trust_score ASC
            LIMIT 10
        """)
        rows = cur.fetchall()
        if not rows:
            return ("No supplier risk data found yet. "
                    "Risk scores are generated after connecting suppliers and running the **Risk Assessment** module.")

        high_risk = [r for r in rows if r["trust_score"] < 40]
        avg_score = sum(r["trust_score"] for r in rows) / len(rows)

        if high_risk:
            names = ", ".join(r["company_legal_name"] for r in high_risk)
            return (
                f"🚨 **Risk Alert:** {len(high_risk)} high-risk supplier(s) with trust score < 40: **{names}**.\n"
                f"Average trust score across {len(rows)} suppliers: **{avg_score:.1f}/100**.\n"
                f"Review their compliance, delivery delays, and defect rates on the Supplier Risk page."
            )
        status = "⚠️ Some suppliers need attention." if avg_score < 60 else "✅ Most suppliers performing well."
        return (
            f"📊 **Supplier Risk Overview** — {len(rows)} suppliers assessed.\n"
            f"Average trust score: **{avg_score:.1f}/100**. {status}\n"
            f"Lowest score: {rows[0]['company_legal_name']} ({rows[0]['trust_score']:.1f}). "
            f"Visit the **Supplier Risk** page for full breakdown."
        )
    except Exception as e:
        logger.warning(f"[Chat/risk] DB query failed: {e}")
        return None
    finally:
        cur.close()
        conn.close()


def _groq_fallback(query: str) -> str:
    """Call Groq API as the last resort for open-ended / tricky questions."""
    if not settings.GROQ_API_KEY:
        return ("I can answer questions about inventory levels, supplier info, risk scores, "
                "or supply chain concepts like safety stock, EOQ, bullwhip effect, and more. What would you like to know?")
    try:
        resp = requests.post(
            GROQ_URL,
            headers={
                "Authorization": f"Bearer {settings.GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "llama-3.3-70b-versatile",
                "messages": [
                    {
                        "role": "system",
                        "content": (
                            "You are ChainBot, an expert Supply Chain Management assistant for a plastic "
                            "manufacturing company in India. You specialise in inventory management, supplier "
                            "risk assessment, demand forecasting, route optimisation, and SCM best practices. "
                            "Be concise, practical, and friendly. Answer in 3-5 sentences max. "
                            "Use emojis sparingly for clarity. Avoid generic advice — be tactical."
                        ),
                    },
                    {"role": "user", "content": query},
                ],
                "temperature": 0.6,
                "max_tokens": 420,
            },
            timeout=20,
        )
        if resp.status_code == 200:
            data = resp.json()
            return data["choices"][0]["message"]["content"]
    except requests.exceptions.Timeout:
        pass
    except Exception as e:
        logger.error(f"[Chat/Groq fallback] Error: {e}")
    return ("I'm having trouble reaching the AI service right now. "
            "Try asking about your inventory, suppliers, risk scores, or supply chain concepts like safety stock or EOQ!")


# ── Main endpoint (replaces old one) ───────────────────────────────

@router.post("/chat-response")
async def get_chat_response(query: str):
    """
    Hybrid ChainBot engine:
      1. DB-aware answers (inventory / supplier / risk — real MySQL data)
      2. SCM knowledge base (safety stock, EOQ, bullwhip, etc.)
      3. Groq API fallback for anything else
    """
    try:
        intent = _detect_intent(query)

        # ── Layer 1: DB lookup ──────────────────────────────────────
        db_answer: Optional[str] = None
        if intent == "inventory":
            db_answer = _db_inventory(query)
        elif intent == "supplier":
            db_answer = _db_suppliers(query)
        elif intent == "risk":
            db_answer = _db_risk(query)

        if db_answer:
            return {"success": True, "response": db_answer, "source": "database"}

        # ── Layer 2: Knowledge base ─────────────────────────────────
        kb_answer = _match_kb(query)
        if kb_answer:
            return {"success": True, "response": kb_answer, "source": "knowledge_base"}

        # ── Layer 3: Groq AI ────────────────────────────────────────
        groq_answer = _groq_fallback(query)
        return {"success": True, "response": groq_answer, "source": "groq"}

    except Exception as e:
        logger.error(f"[Chat] Unhandled error: {e}")
        return {"success": True, "response": "I encountered an error. Please try again."}
