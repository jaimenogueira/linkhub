# **App Name**: LinkHub

## Core Features:

- Authentication: User authentication with username and password stored in a text file.
- Link Dashboard: Dashboard displaying registered links in a grid layout.
- Link Display: Link items displaying application name and associated icon/image, redirecting to the corresponding web link in a new tab upon click.
- Add New Link Form: Form to add a new link, including fields for application name, URL, and image/icon upload.
- Link Data Storage: Image uploading to the /public/images/ directory and storage of link data in a /public/data/links.txt file.
- Dynamic Link Visualization: Dynamic rendering of link blocks on page load, reading data from links.txt and loading images directly from the /public/images/ folder.
- Logout: User logout functionality.

## Style Guidelines:

- Primary color: Saturated purple (#9D4EDD) to convey sophistication and focus on curated links.
- Background color: Light gray (#EAEAEA) to ensure a clean and modern aesthetic, providing a neutral backdrop that allows links to stand out.
- Accent color: Blue (#5DADE2), analogous to the primary color, adds a cool, complementary contrast.
- Headline font: 'Space Grotesk' (sans-serif) for headlines and short amounts of body text; body font: 'Inter' (sans-serif) for body text.
- Use simple, modern icons for each link to provide visual cues. Icons should complement the color scheme.
- Grid layout for the link dashboard to ensure a clean and organized presentation.
- Subtle transition animations when hovering over link items to provide user feedback.