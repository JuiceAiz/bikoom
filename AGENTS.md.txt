Read `AGENTS.md` completely and use it as the project requirements and business rules for this application.

Build the Bikoom Store website as a complete working first version.

Do not only create an architecture plan or explain what you would build. Start building the actual application, including the UI, pages, components, functionality, and backend integration required by the project.

## Project

The website is for **Bikoom Store**, a small business based in Ogoja, Nigeria.

Bikoom sells and provides:

* Laptops
* Phones
* Starlink installation
* Furniture
* Other products
* Services such as photocopying

Photocopying is available in Ogoja only.

The website should feel like a modern, professional small-business storefront rather than a generic template.

## Main customer experience

Build the customer-facing website with:

* Homepage
* Shop/product listing
* Product categories
* Product detail pages
* Search if useful
* Cart / Order Request
* Delivery/Waybill request
* Contact/WhatsApp actions
* Google sign-in
* Responsive mobile and desktop layouts

Customers should be able to:

1. Browse products.
2. Open product details.
3. Add products to their cart.
4. Change quantities.
5. Remove products.
6. Review their Order Request.
7. Continue to WhatsApp with the selected products included in a pre-filled message.

There must be no online payment checkout.

The actual price negotiation, payment, and final sales conversation happen directly between the customer and Bikoom through WhatsApp.

## Products

Create realistic sample/demo products so the application can be properly tested and visually populated.

Include sample products across categories such as:

* Laptops
* Phones
* Furniture
* Starlink-related products/services
* Other relevant products/services

Use realistic Nigerian pricing and product information for demo purposes.

Products should support:

* Product name
* Description
* Images
* Category
* Price
* Price visibility
* Availability
* Featured status where useful

Some products should display a price while others should use **"Contact for Price"** so we can test both states.

These demo products will later be replaced or edited by Bikoom.

## Admin dashboard

Build a protected admin dashboard where Bikoom can manage his store.

The dashboard should allow an administrator to:

* Add products
* Edit products
* Delete products
* Upload/change product images
* Change product prices
* Toggle "Show Price" / "Contact for Price"
* Change product availability
* Manage categories
* Manage homepage banners
* Replace banner images
* View customer order requests
* View delivery/waybill requests

Keep the interface simple enough for a non-technical business owner to use.

## Authentication

Implement Google authentication using Supabase Auth.

The intended flow is:

Customer → Continue with Google → Google OAuth → Supabase Auth → authenticated website session.

Create the appropriate authentication structure and configuration.

Admin users must have protected access to the admin dashboard.

Do not treat every authenticated customer as an administrator.

## Supabase

Connect the application to Supabase and create the database structure needed for:

* Products
* Categories
* Users/profiles
* Order requests
* Order request items
* Delivery requests
* Banners
* Admin authorization where appropriate

Use Supabase Storage where appropriate for product and banner images.

Create the necessary database schema and application integration.

## Mailgun

Integrate Mailgun for transactional email notifications.

Use it for appropriate notifications such as:

* New order request
* New delivery/waybill request
* Other useful store notifications

The implementation should be ready for Mailgun credentials to be supplied through environment variables.

## WhatsApp

Use WhatsApp as the main communication channel between customers and Bikoom.

Create clear WhatsApp call-to-action buttons throughout the site where appropriate.

The Order Request should generate a useful pre-filled WhatsApp message containing information such as:

* Customer name where available
* Selected products
* Quantities
* Displayed prices where available
* A request for final pricing
* Delivery/location information where applicable

Do not create an internal messaging system.

## Delivery / Waybill

Create a simple delivery/waybill request form.

Collect useful information such as:

* Name
* Phone/WhatsApp number
* Location
* Product/order information
* Additional notes

The request should be stored and should be capable of triggering a Mailgun notification to Bikoom.

Do not build live courier tracking.

## Design

Design the site rather than producing a bare functional interface.

Use:

* Strong visual hierarchy
* Modern typography
* Good spacing
* Professional cards
* Product imagery
* Clear calls-to-action
* Responsive layouts
* Mobile-first considerations
* Consistent buttons and components
* A polished homepage
* A professional admin dashboard

Create a coherent visual identity for Bikoom Store.

Use placeholder/demo imagery where real product images are not yet available.

Do not make the design overly complicated.

## Branding

Use:

**Bikoom Store**

as the current brand name.

Structure the branding so it can be changed later if the business eventually rebrands.

## Location and delivery

Clearly communicate that Bikoom operates from Ogoja.

Photocopying should be identified as an Ogoja-only service.

For other products/services, customers outside Ogoja can request delivery, with delivery costs discussed directly with Bikoom.

Do not invent fixed delivery prices.

## Environment variables and credentials

Create the appropriate `.env.example` file showing the variables required for:

* Supabase
* Google OAuth
* Mailgun
* Other required integrations

Do not place actual private API keys, passwords, or secret credentials into source code.

The application should clearly indicate where those credentials need to be supplied.

## Technical quality

Use a modern, maintainable project structure.

Create reusable components where appropriate.

Keep the code organized and understandable.

Make the website responsive.

Handle loading states, empty states, errors, and basic form validation.

Make the main customer flow functional rather than creating static mock screens.

## Important

Build the actual first version now.

Do not stop after creating a plan.

Do not only describe the architecture.

Create the application, pages, UI, sample data, database structure, integrations, and functionality described above.

After implementation, run the available checks/build process and fix errors that you encounter.

At the end, provide a concise summary of:

1. What was built.
2. What credentials/environment variables still need to be supplied.
3. Any setup steps I need to complete manually.
4. Any known limitations or areas that should be refined next.
