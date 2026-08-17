# Storefront Simple

Build a production-ready global e-commerce SaaS platform where anyone can create and publish an online store. called sellurway

CORE BUSINESS MODEL:

FREE PLAN:

Maximum 5 products per store

Free storefront

Product images

Product descriptions

Product pricing

Shopping cart

Customer checkout

Order management

Shareable store URL

Basic storefront theme

Basic store customization

LIFETIME PLAN:

One-time payment of $10 USD

NOT a monthly subscription

Unlimited products

Unlimited orders

Advanced store customization

Premium themes

Customer management

Store analytics

Remove platform branding

Lifetime access to the paid features

IMPORTANT:

The $10 payment must be a ONE-TIME lifetime purchase. Never present it as $10/month or recurring billing.

PLATFORM STRUCTURE:

Create these main areas:

MARKETING LANDING PAGE

Create a modern, premium landing page explaining:

Headline:

"Your store. Your products. Your business."

Subheadline:

"Create your online store for free. Start with 5 products, then unlock unlimited products for just $10 — lifetime."

Primary CTA:

"Create Your Store"

Secondary CTA:

"View Demo Store"

Include:

Hero section

How it works

Features

Free vs Lifetime comparison

Example storefront preview

Testimonials section

FAQ

Strong final CTA

Footer

Keep the design modern, premium, trustworthy and global.

Do not copy Shopify's visual design or branding.

AUTHENTICATION

Implement secure authentication.

Users should be able to:

Sign up

Log in

Log out

Reset password

Update account information

Use Supabase Authentication.

STORE CREATION

After signing up, guide the user through creating their store.

Ask for:

Store name

Store description

Store category

Store logo

Store banner/image

Country

Currency

Contact email

Contact phone/WhatsApp

Store URL slug

Generate a unique storefront URL such as:

/store/store-name

Make sure the slug is unique and safe.

MERCHANT DASHBOARD

Create a polished dashboard.

Sidebar navigation:

Dashboard

Products

Orders

Customers

Storefront

Themes

Analytics

Payments

Settings

Upgrade

Dashboard overview should display:

Total sales

Number of orders

Number of products

Customers

Recent orders

Store status

Current plan

Show a clear product-limit indicator for free users:

"3 / 5 products"

When a free user reaches 5 products, disable creating additional products and show:

"You've reached the 5-product limit.

Unlock unlimited products for $10 lifetime."

Do NOT delete or hide existing products.

PRODUCT MANAGEMENT

Merchants can:

Add product

Edit product

Delete product

Upload multiple product images

Product name

Description

Price

Compare-at price

SKU

Stock quantity

Category

Product status

Featured product

Product variants such as size/color

Free users are limited to 5 active products.

Lifetime users have unlimited products.

Validate all product data before saving.

STOREFRONT

Every merchant gets a beautiful public storefront.

Example:

/store/my-store

Storefront should include:

Store logo

Store name

Store description

Navigation

Product grid

Product search

Product categories

Product details

Add to cart

Cart

Checkout

Contact information

Social links

Store policies

Make the storefront mobile-first and responsive.

Customers do NOT need an account to browse products.

Allow customers to purchase as guests.

SHOPPING CART

Create a complete shopping cart.

Customers can:

Add products

Change quantities

Remove products

View subtotal

View shipping cost if applicable

View total

Proceed to checkout

Validate product availability and prices on the server before creating an order.

Never trust prices or totals supplied by the browser.

CHECKOUT AND PAYMENTS

Build a secure payment architecture.

The platform must support merchant payments through a payment provider.

IMPORTANT SECURITY RULES:

Never store raw card numbers

Never store CVV

Never expose secret payment keys in frontend code

Payment processing must happen through secure server-side/API functions

Verify payment status using the payment provider's server-side confirmation/webhook

Never mark an order as paid solely because the browser says payment succeeded

Create a payment abstraction layer so additional payment providers can be added later without rebuilding the entire checkout system.

For the MVP, implement the selected payment provider cleanly and structure the code so additional providers can be added later.

8B. PLATFORM $10 LIFETIME PAYMENT

Create a separate checkout for merchants upgrading their account.

Product:

"Lifetime Unlimited"

Price:

$10 USD

Billing:

ONE-TIME PAYMENT ONLY.

show a beutifeul paywall and 

After verified successful payment:

Upgrade merchant account from free to lifetime

Remove 5-product limit

Enable unlimited products

Enable lifetime features

Store transaction/payment reference

Show confirmation

The upgrade must be idempotent so repeated payment webhooks cannot duplicate upgrades.

Never rely only on frontend state to determine whether someone is paid.

ORDERS

Merchant dashboard should include:

Order ID

Customer name

Customer email

Customer phone

Products

Quantities

Subtotal

Shipping

Total

Payment status

Fulfillment status

Order date

Statuses:

Pending

Paid

Processing

Shipped

Completed

Cancelled

Refunded

Allow merchants to update fulfillment status.

CUSTOMERS

Create a customer management page.

Show:

Name

Email

Phone

Number of orders

Total spent

Last order

Customer since

Do not expose private customer information to other merchants.

Each merchant can only access customers belonging to their own stores.

THEMES

Create several original storefront themes.

Do NOT copy Shopify themes or any other company's designs.

Themes should have different layouts and visual styles.

Free users receive basic themes.

Lifetime users receive additional premium themes.

Make theme settings customizable:

Logo

Store colors

Typography

Hero image

Button style

Homepage sections

Featured products

ANALYTICS

Lifetime users get analytics including:

Revenue

Orders

Average order value

Best-selling products

Sales over time

Number of customers

Use clean charts and cards.

Do not display fake analytics.

ADMIN / STAFF DASHBOARD

Create a completely separate protected admin area.

Only authorized platform staff can access it.

Admin sections:

Overview

Users

Stores

Orders

Platform Payments

Lifetime Purchases

Reports

Support

Settings

Admin overview:

Total users

Total stores

Active stores

Lifetime purchases

Total platform revenue

Orders

Reported stores

USER MANAGEMENT:

View users

View account status

Suspend user

Restore user

STORE MANAGEMENT:

View stores

Search stores

Suspend store

Restore store

Review reported stores

STAFF ROLES:

Owner:

Full platform access.

Admin:

User/store/order management.

Support:

Customer support and account assistance.

Moderator:

Reports and store/content moderation.

Implement proper role-based access control.

Never rely on hiding frontend buttons for authorization.

Enforce permissions server-side/database-side.

SUPPORT

Create a basic support ticket system.

Customers/merchants can:

Create ticket

Select category

Add message

View ticket status

Reply

Staff can:

View tickets

Reply

Change status

Assign ticket to staff

Statuses:

Open

In Progress

Resolved

Closed

REPORTING / SAFETY

Allow users to report stores.

Report categories:

Fraud

Prohibited products

Copyright complaint

Scam

Harassment

Other

Reports appear in the staff dashboard.

DATABASE

Use Supabase PostgreSQL.

Create properly normalized tables for:

profiles

stores

store_members

products

product_images

product_variants

categories

orders

order_items

customers

payments

subscriptions_or_entitlements

themes

store_settings

support_tickets

support_messages

reports

admin_audit_logs

Use UUID primary keys.

Add created_at and updated_at timestamps where appropriate.

SECURITY / RLS

Enable Supabase Row Level Security.

Users can only access their own account information.

Merchants can only access stores where they are authorized members.

Merchants can only manage products belonging to their stores.

Merchants can only access orders belonging to their stores.

Customers must never be able to access another customer's private information.

Admin/staff access must use role-based authorization.

Never solve authorization problems by disabling RLS.

Use secure server-side functions for sensitive operations.

MOBILE RESPONSIVENESS

The entire platform must work beautifully on:

Mobile

Tablet

Desktop

Merchant dashboard should have a responsive navigation system.

Public storefronts must prioritize mobile shopping.

PERFORMANCE

Optimize:

Image loading

Database queries

Storefront loading

Product grids

Mobile performance

Do not load unnecessary libraries.

DESIGN

Design language:

Premium

Modern

Clean

Fast

Trustworthy

Global

Avoid:

Generic AI-looking gradients

Excessive animations

Clutter

Fake statistics

Fake testimonials presented as real

Shopify branding

Shopify UI copying

Use excellent typography, spacing, hierarchy and responsive layouts.

IMPORTANT PRODUCT RULE

The most important user journey is:

Visitor

→ Sign up

→ Create store

→ Add products

→ Publish store

→ Share store

→ Customer visits store

→ Customer adds product to cart

→ Customer checks out

→ Payment verified

→ Merchant receives order

→ Merchant manages order

The second important journey is:

Merchant reaches 5 products

→ Sees upgrade message

→ Pays $10 once

→ Payment verified

→ Account receives lifetime entitlement

→ Unlimited products unlocked

Make both flows extremely simple.

NO FAKE FUNCTIONALITY

Do not create buttons that appear to work but don't.

Do not use fake payment success.

Do not use fake orders.

Do not use fake analytics.

Do not hardcode authentication.

If a feature requires an external API or configuration that is not yet available, clearly isolate it and create the correct integration structure rather than pretending it works.

CODE QUALITY

Create reusable components.

Keep business logic separate from UI.

Use environment variables for secrets.

Never expose private API keys.

Use proper error handling.

Show useful error messages.

Show loading states.

Show empty states.

Prevent duplicate submissions.

Prevent duplicate orders.

Prevent duplicate payment processing.

Make the project production-ready and easy to extend.

Before considering the implementation complete, test the major flows:

Sign up

Login

Create store

Add 5 products

Attempt 6th product as free user

Upgrade to $10 lifetime

Verify entitlement

Add unlimited products

Customer browsing

Cart

Checkout

Payment verification

Order creation

Merchant order management

Staff login

Staff permissions

Store isolation

RLS/security

Build the application as a real working product, not a static mockup.

FLEXIBLE SELLING MODES

Do NOT force every business to use a shopping cart or online checkout.

Each merchant must be able to choose how customers purchase from their store.

Create three selling modes:

A. FULL E-COMMERCE

Customer flow:

Product → Add to Cart → Cart → Checkout → Payment → Order Confirmation

Use this for businesses that want normal online shopping.

B. DIRECT ORDER / DELIVERY

Customer flow:

Product → Order Now → Customer Details → Delivery Details → Place Order

There must be NO shopping cart and NO online checkout in this mode.

The customer should be able to order a product directly.

Collect:

Customer name

Phone number

Email (optional)

Delivery address

Apartment/unit (optional)

City

Postal code where applicable

Delivery instructions

Preferred delivery date/time where enabled

Product

Quantity

After the customer places the order, show a beautiful confirmation page with the order number.

The merchant receives the order inside their dashboard.

C. WHATSAPP ORDERING

Customer selects a product and clicks:

"Order on WhatsApp"

Automatically generate a WhatsApp message containing:

Store name

Product name

Quantity

Product price

Customer's requested information

Allow the merchant to configure their WhatsApp number.

Do not require online payment for WhatsApp orders.

STORE SELLING SETTINGS

Add:

Settings → Selling & Checkout

Allow merchants to select:

Full Checkout

Direct Delivery Orders

WhatsApp Orders

Multiple methods

If "Multiple methods" is enabled, allow the merchant to choose the action displayed on each product:

"Add to Cart"

"Order Now"

"Order on WhatsApp"

The storefront must dynamically change based on the merchant's selected selling mode.

DELIVERY FEATURES

Create a delivery settings section.

Merchant can enable/disable:

Delivery

Store pickup

Local delivery

Customer-selected delivery time

Delivery instructions

Allow merchants to configure:

Delivery fee

Free delivery threshold

Delivery areas

Minimum order amount

Estimated delivery time

Allow different delivery fees for different delivery areas.

Example:

Area A — $5 delivery

Area B — $8 delivery

Area C — $12 delivery

Do not force delivery settings on businesses that do not need delivery.

DELIVERY ORDERS

Add a dedicated delivery section inside Orders.

Delivery order information should show:

Order number

Customer

Phone

Products

Quantity

Total

Delivery address

Delivery fee

Delivery instructions

Preferred delivery time

Order date

Order status

Delivery statuses:

New

Confirmed

Preparing

Ready

Out for Delivery

Delivered

Cancelled

Allow merchants to update the status.

Customers should see an order confirmation after submitting their order.

NO-CHECKOUT BUSINESS SUPPORT

The platform must support businesses that do NOT want customers paying online.

Examples include:

Restaurants

Food delivery businesses

Bakeries

Florists

Local clothing sellers

Grocery businesses

Small local stores

Service businesses

Businesses that accept cash on delivery

Businesses that accept payment through WhatsApp

Businesses that take payment manually

Do not show unnecessary payment fields when the merchant has disabled online checkout.

Do not show a cart when the merchant has disabled cart functionality.

Do not force customers to create accounts.

PRODUCT ACTION SETTINGS

Allow each merchant to configure the primary product button.

Options:

"Add to Cart"

"Order Now"

"Order on WhatsApp"

"Contact Us"

The storefront should use the selected action consistently.

PAYMENT METHOD SETTINGS

Allow merchants to configure whether they accept:

Online payment

Cash on delivery

Manual payment

WhatsApp payment instructions

Store pickup payment

For manual payments, allow the merchant to display their own payment instructions.

Never claim that a manual payment has been verified automatically.

ORDER CREATION

All order types must create an order record in the merchant dashboard.

Track:

Order source

Selling mode

Payment method

Payment status

Fulfillment status

Delivery information

Possible order sources:

Online Checkout

Direct Order

WhatsApp

Possible payment statuses:

Pending

Paid

Cash on Delivery

Manual Payment

Failed

Refunded

Make the database flexible enough to support all three selling modes without duplicating the entire order system.

STOREFRONT UX

The storefront must automatically adapt to the merchant's selling mode.

If cart is disabled:

Do not show cart icon

Do not show "Add to Cart"

Do not create unnecessary cart pages

If online checkout is disabled:

Do not show payment checkout

Do not request card information

If delivery is enabled:

Show delivery information clearly

Collect delivery details during ordering

The customer experience should feel intentional and professional, not like disabled features.

BUSINESS TYPE PRESETS

During store setup, ask:

"What are you selling?"

Options:

Physical Products

Food & Delivery

Services

Digital Products

Local Business

Other

Use this selection to recommend the appropriate selling mode, but ALWAYS allow the merchant to change it later.

For example:

Food & Delivery → recommend Direct Delivery Orders.

Physical Products → recommend Full Checkout.

Services → recommend Order/Booking or Contact.

The merchant remains in control.

Ensure online checkout orders are marked Paid only after provider server verification, not based on browser signals.nd add photos you see and templates for 10 dollar for extra feature feature and dont foold with the 10 subcription just add wuth the a crown for subscribresr you see add free templates and exclusive templates and feturees with a gold  crown

make sure everything is perfect everything add everything like shoplify like upload photos for products and add more templates and before creating a store make them choose a template first and the password must have 6 or more characters and one number and terms box to tick and lastly remove google sign up
please dont show 10 dollars all over so change this trash Create your online store for free. Start with 5 products, then unlock unlimited products for just $10 — lifetime. and show the demo store and the must email must not be verifeied and change the "AURORA" NAME ITS CRINGE ON THE PICTURE
Please fix the dashborad its empty and please make them be able to add 5 pictures if the want so when the click an item its expands shows the descriptions and staff and please dont lie remove no subriptions no card needed and staff and add an eye when typing the password so the see what they are typing and make this a downable website

make sure everything is working and ready to deploy

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://sellurway.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/604666e2-2421-47e6-b5e4-5079f1161a17).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
