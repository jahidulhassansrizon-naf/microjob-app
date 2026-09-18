"use client";

import { useMemo, useState } from "react";
import Footer from "../../components/Footer";

type Card = {
  image: string;
  title: string;
  used: number;
  category: string;
  href?: string;
};

type Section = {
  id: string;
  title: string;
  cards: Card[];
};

const makeCard = (
  image: string,
  title: string,
  category: string,
  used = 1,
): Card => ({
  image,
  title,
  used,
  category,
});

const coupleCards: Card[] = [
  makeCard(
    "https://files.sohozkaj.com/ai-templates/romantic-couple-in-traditional-attire/1782125047985-b131e73f7e0f.jpg",
    "Romantic Couple In Traditional Attire",
    "Couple portrait",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/romantic-forest-walk/1780896865034-b8a58b1c27f6.jpg",
    "Romantic Forest Walk",
    "Couple portrait",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/cloud-romance-portrait/1782380784723-a6c33ca1d217.jpg",
    "Cloud Romance Portrait",
    "Couple portrait",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/romantic-couple-portrait/1782640344468-9fa5f377a037.jpg",
    "Romantic Couple Portrait",
    "Couple portrait",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/back-to-back-couple-portrait/1782883656363-32580df93224.jpg",
    "Back To Back Couple Portrait",
    "Couple portrait",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/pastel-bridal-portrait-collage/1783245336245-c31f2f4fd96e.jpg",
    "Pastel Bridal Portrait Collage",
    "Couple portrait",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/window-romance-portrait/1783320510727-027ba119b784.jpg",
    "Window Romance Portrait",
    "Couple portrait",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/deshi-marriage-day-couple-portrait/1782625046046-40ba9464259e.jpg",
    "Deshi Marriage Day Couple Portrait",
    "Couple portrait",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/cozy-couple-in-forest/1782296927823-6532ff732663.jpg",
    "Cozy Couple In Forest",
    "Couple portrait",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/twilight-wedding-couple/1782637680286-0c7fe230dfde.jpg",
    "Twilight Wedding Couple",
    "Couple portrait",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/anniversary-movie-poster/1782731712229-cf6a2143e92c.jpg",
    "Anniversary Movie Poster",
    "Couple portrait",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/dreamy-couple-rooftop-ride/1782970958707-8d5f39952d84.jpg",
    "Dreamy Couple Rooftop Ride",
    "Couple portrait",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/romantic-beach-collage/1783417186577-12829bec84ea.jpg",
    "Romantic Beach Collage",
    "Couple portrait",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/lavender-lake-portrait/1783428033925-3970861b3efe.jpg",
    "Lavender Lake Portrait",
    "Couple portrait",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/intimate-candid-couple-portrait/1782297112260-7564f3db9a68.jpg",
    "Intimate Candid Couple Portrait",
    "Couple portrait",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/romantic-beach-stroll/1782041496045-dcfb5d87f222.jpg",
    "Romantic Beach Stroll",
    "Couple portrait",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/moonlit-couple-fantasy/1782715182796-87dd0bed0b8b.jpg",
    "Moonlit Couple Fantasy",
    "Couple portrait",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/mirror-heritage-portrait/1783491733319-0ee5da2711fd.jpg",
    "Mirror Heritage Portrait",
    "Couple portrait",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/bollywood-save-the-date/1783426815450-0a2caca4f8cd.jpg",
    "Bollywood Save The Date",
    "Couple portrait",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/rainy-urban-romance/1783315401987-0a33c4169239.jpg",
    "Rainy Urban Romance",
    "Couple portrait",
  ),
];

const creativeCards: Card[] = [
  makeCard(
    "https://files.sohozkaj.com/ai-templates/t/1780895044323-81c78b9fcadf.jpg",
    "T",
    "Creative Photos",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/cinematic-double-exposure-poster/1780461570639-a95d53459474.jpg",
    "Cinematic Double Exposure Poster",
    "Creative Photos",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/abstract-portrait-art/1780462924972-a1c4e381107a.jpg",
    "Abstract Portrait Art",
    "Creative Photos",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/cinematic-street-vibe/1780464271195-4da712974392.jpg",
    "Cinematic Street Vibe",
    "Creative Photos",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/urban-commuter-portrait/1780464756718-e9063d0313c1.jpg",
    "Urban Commuter Portrait",
    "Creative Photos",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/pop-art-vortex-creator/1780555989587-3153105020ac.jpg",
    "Pop Art Vortex Creator",
    "Creative Photos",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/urban-subway-scene/1780914570649-d72ede84c734.jpg",
    "Urban Subway Scene",
    "Creative Photos",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/dramatic-rim-light-portrait/1780382438750-81427059d93b.jpg",
    "Dramatic Rim Light Portrait",
    "Creative Photos",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/high-end-collectors-poster/1780461818489-67ef968b5428.jpg",
    "High End Collectors Poster",
    "Creative Photos",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/social-media-optical-illusion/1780463111019-c1955ad40a58.jpg",
    "Social Media Optical Illusion",
    "Creative Photos",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/double-exposure-silhouette/1780464436164-d23e1259f83a.jpg",
    "Double Exposure Silhouette",
    "Creative Photos",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/cinematic-double-exposure/1780465217102-3231535f591c.jpg",
    "Cinematic Double Exposure",
    "Creative Photos",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/twilight-reflection/1782380371316-c29a2b682f34.jpg",
    "Twilight Reflection",
    "Creative Photos",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/cinematic-bus-portrait/1780555717258-191920236f45.jpg",
    "Cinematic Bus Portrait",
    "Creative Photos",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/whimsical-pet-social-post/1780405674934-b9777c07c16b.jpg",
    "Whimsical Pet Social Post",
    "Creative Photos",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/dynamic-art-dance-poster/1780555811514-74556d96ed78.jpg",
    "Dynamic Art Dance Poster",
    "Creative Photos",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/energetic-community-run-collage/1780464081912-b35589669476.jpg",
    "Energetic Community Run Collage",
    "Creative Photos",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/glitch-portrait-design/1780464538954-e4631d20ae88.jpg",
    "Glitch Portrait Design",
    "Creative Photos",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/artistic-collage-portrait/1780465366781-25dc7eca3fa9.jpg",
    "Artistic Collage Portrait",
    "Creative Photos",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/dynamic-beach-runner/1780466049752-b7a6b797df76.jpg",
    "Dynamic Beach Runner",
    "Creative Photos",
  ),
];

const productCards: Card[] = [
  makeCard(
    "https://files.sohozkaj.com/ai-templates/friendly-product-duo/1780469523662-94c53dc373df.jpg",
    "Friendly Product Duo",
    "Product advertising",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/cinematic-snack-product-shot/1780471776221-49d413e98808.jpg",
    "Cinematic Snack Product Shot",
    "Product advertising",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/sleek-product-ad-poster/1780573238286-001fd76c3290.jpg",
    "Sleek Product Ad Poster",
    "Product advertising",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/holographic-hand-portrait/1780899155436-b42159d52d3d.jpg",
    "Holographic Hand Portrait",
    "Product advertising",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/luxury-skincare-photography/1780918176269-7cd312a65660.jpg",
    "Luxury Skincare Photography",
    "Product advertising",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/elegant-product-photography/1780921191906-ecab4d9df22e.jpg",
    "Elegant Product Photography",
    "Product advertising",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/fruit-packed-product-photography/1781002587888-22cd857d9f1c.jpg",
    "Fruit Packed Product Photography",
    "Product advertising",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/powerful-product-showcase/1780470888199-e27a5e6a493f.jpg",
    "Powerful Product Showcase",
    "Product advertising",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/cinematic-product-collage/1780477712915-89bf92e4ce7b.jpg",
    "Cinematic Product Collage",
    "Product advertising",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/premium-product-ad-poster/1780574914157-91601b648b9c.jpg",
    "Premium Product Ad Poster",
    "Product advertising",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/cinematic-product-advertisement/1780914346007-467edffe3535.jpg",
    "Cinematic Product Advertisement",
    "Product advertising",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/tropical-skincare-showcase/1780920297491-625d14afa0c5.jpg",
    "Tropical Skincare Showcase",
    "Product advertising",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/tropical-luxury-product-photography/1780921741625-3828729714c9.jpg",
    "Tropical Luxury Product Photography",
    "Product advertising",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/facebook-image-ad-template/1781153237410-e21e98020a46.jpg",
    "Facebook Image Ad Template",
    "Product advertising",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/elegant-product-collage/1780471486400-6208d29cfd00.jpg",
    "Elegant Product Collage",
    "Product advertising",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/vintage-toy-packaging-portrait/1780478534644-b013fc7f8387.jpg",
    "Vintage Toy Packaging Portrait",
    "Product advertising",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/refreshing-beverage-advertisement/1780913463599-cdb782ab206e.jpg",
    "Refreshing Beverage Advertisement",
    "Product advertising",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/refreshing-beverage-ad/1780916499785-e5838b28d29b.jpg",
    "Refreshing Beverage Ad",
    "Product advertising",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/luxury-handbag-photography/1780920866652-7b5dc9b86bea.jpg",
    "Luxury Handbag Photography",
    "Product advertising",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/summer-product-showcase/1781001571221-4c390799f11f.jpg",
    "Summer Product Showcase",
    "Product advertising",
  ),
];

const recoveryCards: Card[] = [
  makeCard(
    "https://files.sohozkaj.com/ai-templates/old-photo-restoration/1785418894912-e3f75dfecdc2.jpg",
    "Old Photo Restoration",
    "Photo recovery",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/natural-photo-restoration/1784096084634-977d05262e80.jpg",
    "Natural Photo Restoration",
    "Photo recovery",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/historical-photo-restoration/1786446469070-2086db964ec5.jpg",
    "Historical Photo Restoration",
    "Photo recovery",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/restoring-blurry-images/1783313608394-271663f8c375.jpg",
    "Restoring Blurry Images",
    "Photo recovery",
  ),
];

const childCards: Card[] = [
  makeCard(
    "https://files.sohozkaj.com/ai-templates/magical-baby-beach-portrait/1780893843491-ba9822a4cc78.jpg",
    "Magical Baby Beach Portrait",
    "Beautiful picture of a child",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/whimsical-crayon-portrait/1782293727430-527b76e4cd99.jpg",
    "Whimsical Crayon Portrait",
    "Beautiful picture of a child",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/child-and-cartoon-cat/1782625613305-ddb4799d2809.jpg",
    "Child And Cartoon Cat",
    "Beautiful picture of a child",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/cartoon-buddy-portrait/1782630669395-93a64f3182ec.jpg",
    "Cartoon Buddy Portrait",
    "Beautiful picture of a child",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/young-hero-officer/1782890693584-41f10a3f172d.jpg",
    "Young Hero Officer",
    "Beautiful picture of a child",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/rainbow-clog-ad-poster/1783233475436-d2cdcd8076a3.jpg",
    "Rainbow Clog Ad Poster",
    "Beautiful picture of a child",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/crate-hideaway-portrait/1785151604628-0bf42f0ff0c5.jpg",
    "Crate Hideaway Portrait",
    "Beautiful picture of a child",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/whimsical-child-portrait/1780902267733-239506435947.jpg",
    "Whimsical Child Portrait",
    "Beautiful picture of a child",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/movie-poster/1782214857293-61de951e5f3d.jpg",
    "Movie Poster",
    "Beautiful picture of a child",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/whimsical-buddy-portrait/1782625944728-8d65a9ca2038.jpg",
    "Whimsical Buddy Portrait",
    "Beautiful picture of a child",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/golden-swan-dock-portrait/1782632354788-dcf3225e81ee.jpg",
    "Golden Swan Dock Portrait",
    "Beautiful picture of a child",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/moonlit-rainy-wonder/1783491804373-2c57f959e297.jpg",
    "Moonlit Rainy Wonder",
    "Beautiful picture of a child",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/cute-planter-portrait/1783428521994-a9ab39dc9c96.jpg",
    "Cute Planter Portrait",
    "Beautiful picture of a child",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/cherry-blossom-toddler-portrait/1784097309782-939b02f2d85d.jpg",
    "Cherry Blossom Toddler Portrait",
    "Beautiful picture of a child",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/cheerful-classroom-adventure/1780902431799-1b864e8aefb8.jpg",
    "Cheerful Classroom Adventure",
    "Beautiful picture of a child",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/motu-patlu-portrait/1782625295570-2e84f08b1ab7.jpg",
    "Motu Patlu Portrait",
    "Beautiful picture of a child",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/ben-10-kids-portrait/1782630356586-3e6b095efbc9.jpg",
    "Ben 10 Kids Portrait",
    "Beautiful picture of a child",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/kitkat-product-portrait/1782805826684-323d2b55591a.jpg",
    "Kitkat Product Portrait",
    "Beautiful picture of a child",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/dynamic-ribbon-burst-poster/1782900150333-13516e2bcebd.jpg",
    "Dynamic Ribbon Burst Poster",
    "Beautiful picture of a child",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/learning-through-play/1785135088875-ebac1434f4b2.jpg",
    "Learning Through Play",
    "Beautiful picture of a child",
  ),
];

const birthdayCards: Card[] = [
  makeCard(
    "https://files.sohozkaj.com/ai-templates/elegant-birthday-collage/1780900739547-586fce22f589.jpg",
    "Elegant Birthday Collage",
    "Happy birthday",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/birthday-poster/1782210032437-a5de26e9c9f1.jpg",
    "Birthday Poster",
    "Happy birthday",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/month-number-balloon-baby-portrait/1784113536480-b1cd967f51bc.jpg",
    "Month Number Balloon Baby Portrait",
    "Happy birthday",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/our-little-ones-happy-day/1784524168969-ea3eb5f0eed0.jpg",
    "Our Little Ones Happy Day",
    "Happy birthday",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/may-your-days-ahead-be-beautiful/1785305391699-36889a4aecd1.jpg",
    "May Your Days Ahead Be Beautiful",
    "Happy birthday",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/luxury-birthday-memory-poster/1785305139249-964215616cda.jpg",
    "Luxury Birthday Memory Poster",
    "Happy birthday",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/birthday-portrait-collage/1785662870446-9e27c298a744.jpg",
    "Birthday Portrait Collage",
    "Happy birthday",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/birthday-collage/1780903129281-8508424389c2.jpg",
    "Birthday Collage",
    "Happy birthday",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/birthday-calendar-collage/1783860182244-5815a9cf0d0b.jpg",
    "Birthday Calendar Collage",
    "Happy birthday",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/happy-birthday-little-angel/1784455831360-b690176b7167.jpg",
    "Happy Birthday Little Angel",
    "Happy birthday",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/happy-birthday-and-best-wishes/1784528499194-e72a31f903d5.jpg",
    "Happy Birthday And Best Wishes",
    "Happy birthday",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/happy-birthday-little-sunshine/1785048172797-a7851ca44808.jpg",
    "Happy Birthday Little Sunshine",
    "Happy birthday",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/dreamy-birthday-glam/1785652244220-c6478c1d2a09.jpg",
    "Dreamy Birthday Glam",
    "Happy birthday",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/birthday-then-and-now/1785671342227-f6dbf140e53c.jpg",
    "Birthday Then And Now",
    "Happy birthday",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/elegant-birthday/1784627879710-4d64cdf5c891.jpg",
    "Elegant Birthday",
    "Happy birthday",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/birthday-wish-calendar-collage/1783923659901-73b7c9f9855e.jpg",
    "Birthday Wish Calendar Collage",
    "Happy birthday",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/our-little-angels-birthday/1784461186912-b2a70e0c760d.jpg",
    "Our Little Angels Birthday",
    "Happy birthday",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/best-wishes-on-your-birthday/1784784006884-30fa4b1fbe1f.jpg",
    "Best Wishes On Your Birthday",
    "Happy birthday",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/enchanted-forest-collage/1785245233995-d3880413f572.jpg",
    "Enchanted Forest Collage",
    "Happy birthday",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/birthday-calendar-collage01/1785653004992-435dd4b68610.jpg",
    "Birthday Calendar Collage01",
    "Happy birthday",
  ),
];

const familyCards: Card[] = [
  makeCard(
    "https://files.sohozkaj.com/ai-templates/cinematic-family-silhouette/1782300760316-372987b01610.jpg",
    "Cinematic Family Silhouette",
    "Family photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/cozy-family-kiss-portrait/1782626389895-4baf8bc40f45.jpg",
    "Cozy Family Kiss Portrait",
    "Family photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/a-beautiful-portrait-of-a-happy-family/1784626181611-d410073d7a5a.jpg",
    "A Beautiful Portrait Of A Happy Family",
    "Family photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/elegant-black-family-portrait/1785603655789-a8e3607f5149.jpg",
    "Elegant Black Family Portrait",
    "Family photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/studio-family-portrait/1785609394826-876e49ad293a.jpg",
    "Studio Family Portrait",
    "Family photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/festive-family-swing-portrait/1785610690177-218442264b25.jpg",
    "Festive Family Swing Portrait",
    "Family photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/family-trip-collage/1785740929317-739042978963.jpg",
    "Family Trip Collage",
    "Family photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/dramatic-family-portrait/1782300077620-b4da6beee745.jpg",
    "Dramatic Family Portrait",
    "Family photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/heart-frame-family-portrait/1782644039247-8e943d2058bf.jpg",
    "Heart Frame Family Portrait",
    "Family photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/family-group-photo/1785409750396-02890c083fe4.jpg",
    "Family Group Photo",
    "Family photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/classic-studio-family-portrait/1785604076383-14b41254b0f3.jpg",
    "Classic Studio Family Portrait",
    "Family photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/watercolor-family-portrait/1785609642136-589843e2a8b4.jpg",
    "Watercolor Family Portrait",
    "Family photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/soft-studio-family-portrait/1785665567276-1ed342eb0017.jpg",
    "Soft Studio Family Portrait",
    "Family photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/family-time-polaroid-collage/1785741453747-8c59e2f71bc4.jpg",
    "Family Time Polaroid Collage",
    "Family photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/minimal-studio-family-portrait/1782381802805-b5bbd06f59cc.jpg",
    "Minimal Studio Family Portrait",
    "Family photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/luxury-mommy-baby-collage/1782731149813-28fcacf1013a.jpg",
    "Luxury Mommy Baby Collage",
    "Family photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/minimal-family-studio-portrait/1785480365786-fb56ad1d7199.jpg",
    "Minimal Family Studio Portrait",
    "Family photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/stacked-family-portrait/1785607028349-ea646894b5e0.jpg",
    "Stacked Family Portrait",
    "Family photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/festive-family-portrait/1785610111342-b78bc7b14133.jpg",
    "Festive Family Portrait",
    "Family photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/heart-frame-portrait/1785735164287-b400a34daf7a.jpg",
    "Heart Frame Portrait",
    "Family photo",
  ),
];

const greetingCards: Card[] = [
  makeCard(
    "https://files.sohozkaj.com/ai-templates/traditional-hal-khata-card/1781524239085-6b0512831323.jpg",
    "Traditional Hal Khata Card",
    "Greeting card",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/motherhood-blessing-portrait/1785721501068-c2495faad2bf.jpg",
    "Motherhood Blessing Portrait",
    "Greeting card",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/friendship-day-campus-portrait/1785764212852-cfd1b880af82.jpg",
    "Friendship Day Campus Portrait",
    "Greeting card",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/ssc-result-crown/1786301886538-3fc6f6e2b88c.jpg",
    "SSC Result Crown",
    "Greeting card",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/friendship-day-portrait/1785659661421-f08afa447926.jpg",
    "Friendship Day Portrait",
    "Greeting card",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/friendship-day-poster/1785746786180-04241be0c13e.jpg",
    "Friendship Day Poster",
    "Greeting card",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/mothers-day-poster-tribute/1786206269694-a8bbac09cfab.jpg",
    "Mothers Day Poster Tribute",
    "Greeting card",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/elegant-beauty-collage/1785668665207-6731e8de8acf.jpg",
    "Elegant Beauty Collage",
    "Greeting card",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/mothers-day-portrait-card/1785749584281-10bda0116972.jpg",
    "Mothers Day Portrait Card",
    "Greeting card",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/mothers-day-embrace/1786202611842-fcc2aa98faae.jpg",
    "Mothers Day Embrace",
    "Greeting card",
  ),
];

const fathersCards: Card[] = [
  makeCard(
    "https://files.sohozkaj.com/ai-templates/heartfelt-fathers-day-tribute/1782021563235-cc0fe618b011.jpg",
    "Heartfelt Fathers Day Tribute",
    "Father's Day",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/father-and-daughter-bond/1782303996816-7acf71b910a6.jpg",
    "Father And Daughter Bond",
    "Father's Day",
  ),
];

const victoryCards: Card[] = [
  makeCard(
    "https://files.sohozkaj.com/ai-templates/victory-day-poster/1785586501153-05bc5171cb82.jpg",
    "Victory Day Poster",
    "Victory Day",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/bangladesh-flag-silhouette/1785671756891-b145b3c3361a.jpg",
    "Bangladesh Flag Silhouette",
    "Victory Day",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/victory-day-poster01/1785912413582-2be2499c93f6.jpg",
    "Victory Day Poster01",
    "Victory Day",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/bangladesh-sunset-portrait/1786251802317-0d0d41862539.jpg",
    "Bangladesh Sunset Portrait",
    "Victory Day",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/bangladesh-flag-portrait02/1786354487083-779f5f95cc57.jpg",
    "Bangladesh Flag Portrait02",
    "Victory Day",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/bangladesh-victory-day-portrait/1786873856708-9d8a5feb8637.jpg",
    "Bangladesh Victory Day Portrait",
    "Victory Day",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/bangladesh-watercolor-portrait/1785587915636-5eafa6069bec.jpg",
    "Bangladesh Watercolor Portrait",
    "Victory Day",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/patriotic-bangladesh-portrait/1785911816631-540f53f4d974.jpg",
    "Patriotic Bangladesh Portrait",
    "Victory Day",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/tricolor-celebration-run/1785951266608-bb835b69113b.jpg",
    "Tricolor Celebration Run",
    "Victory Day",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/bangladesh-patriotic-flight/1786258903650-4c1bac995529.jpg",
    "Bangladesh Patriotic Flight",
    "Victory Day",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/bangladesh-pride-child-portrait/1786854452381-e88c234b5a2b.jpg",
    "Bangladesh Pride Child Portrait",
    "Victory Day",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/victory-day-rally-poster/1785589085428-6f3b653c8645.jpg",
    "Victory Day Rally Poster",
    "Victory Day",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/victory-day-tribute-card/1785903761888-058aaf9c667a.jpg",
    "Victory Day Tribute Card",
    "Victory Day",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/bangladesh-flag-portrait/1786249507434-2ad4507a6a0c.jpg",
    "Bangladesh Flag Portrait",
    "Victory Day",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/bangladesh-army-salute-portrait/1786276861095-5abe95aa0107.jpg",
    "Bangladesh Army Salute Portrait",
    "Victory Day",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/bangladesh-victory-spirit/1786879407397-5f9ef6524f92.jpg",
    "Bangladesh Victory Spirit",
    "Victory Day",
  ),
];

const weddingCards: Card[] = [
  makeCard(
    "https://files.sohozkaj.com/ai-templates/royal-bridal-portrait/1785613815335-396600fd2aa8.jpg",
    "Royal Bridal Portrait",
    "Wedding photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/haldi-celebration-portrait/1785666215481-a23ca1f31f00.jpg",
    "Haldi Celebration Portrait",
    "Wedding photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/punjabi-wedding-embrace/1785734006726-5ad6484de46e.jpg",
    "Punjabi Wedding Embrace",
    "Wedding photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/festive-lehenga-portrait/1785934525426-cb8660788b5f.jpg",
    "Festive Lehenga Portrait",
    "Wedding photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/bridal-saree-portrait/1785958684088-4900c12a37ce.jpg",
    "Bridal Saree Portrait",
    "Wedding photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/romantic-wedding-portrait02/1786351548222-35f168c8e86e.jpg",
    "Romantic Wedding Portrait02",
    "Wedding photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/royal-bridal-grace/1786513147721-7f9f057915d9.jpg",
    "Royal Bridal Grace",
    "Wedding photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/regal-bridal-portrait/1785613396287-45f28b99f50d.jpg",
    "Regal Bridal Portrait",
    "Wedding photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/elegant-bride-reflection/1785666671978-51a3139b5912.jpg",
    "Elegant Bride Reflection",
    "Wedding photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/romantic-petal-topdown/1785763923512-5d251de66e79.jpg",
    "Romantic Petal Topdown",
    "Wedding photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/sunlit-bridal-elegance/1785936457893-50b4db718f17.jpg",
    "Sunlit Bridal Elegance",
    "Wedding photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/wedding-firework-portrait/1785959858097-69c6dd84426c.jpg",
    "Wedding Firework Portrait",
    "Wedding photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/romantic-wedding-calendar/1786791452873-fd27931d23a2.jpg",
    "Romantic Wedding Calendar",
    "Wedding photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/blue-alley-bridal-romance/1786537428355-d3bfdda63ffc.jpg",
    "Blue Alley Bridal Romance",
    "Wedding photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/royal-bridal-portrait-02/1785613562361-9e7af56acaa6.jpg",
    "Royal Bridal Portrait 02",
    "Wedding photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/haldi-ceremony-portrait/1785667325170-ef71a17ab900.jpg",
    "Haldi Ceremony Portrait",
    "Wedding photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/bridal-collage-portrait/1786099856710-72e6c1569a61.jpg",
    "Bridal Collage Portrait",
    "Wedding photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/royal-saree-portrait/1785950525780-340c70525f9a.jpg",
    "Royal Saree Portrait",
    "Wedding photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/vintage-bridal-collage/1786266556411-201154a4f83b.jpg",
    "Vintage Bridal Collage",
    "Wedding photo",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/lakeside-lehenga-portrait/1786449817922-ddc1c3de6e0b.jpg",
    "Lakeside Lehenga Portrait",
    "Wedding photo",
  ),
];

const inspirationalCards: Card[] = [
  makeCard(
    "https://files.sohozkaj.com/ai-templates/self-trust-quote-portrait/1786860896475-ddea5e6aa01c.jpg",
    "Self Trust Quote Portrait",
    "Inspirational",
  ),
  makeCard(
    "https://files.sohozkaj.com/sohozkaj/ai-templates/handpainted-wall-wisdom/1787045160984-d8170efbcfa6.jpg",
    "Handpainted Wall Wisdom",
    "Inspirational",
  ),
  makeCard(
    "https://files.sohozkaj.com/sohozkaj/ai-templates/new-path-inspiration/1787046291325-414bf93ac75e.jpg",
    "New Path Inspiration",
    "Inspirational",
  ),
  makeCard(
    "https://files.sohozkaj.com/sohozkaj/ai-templates/success-mindset-poster/1787085862327-0f63f5ee6278.jpg",
    "Success Mindset Poster",
    "Inspirational",
  ),
  makeCard(
    "https://files.sohozkaj.com/sohozkaj/ai-templates/eternal-love-quote-portrait/1787119199054-b758b3d58491.jpg",
    "Eternal Love Quote Portrait",
    "Inspirational",
  ),
  makeCard(
    "https://files.sohozkaj.com/sohozkaj/ai-templates/golden-smile-quote-portrait/1787115810446-f889a05ccb05.jpg",
    "Golden Smile Quote Portrait",
    "Inspirational",
  ),
  makeCard(
    "https://files.sohozkaj.com/sohozkaj/ai-templates/only-you-love-card/1787123078096-17ace74a577e.jpg",
    "Only You Love Card",
    "Inspirational",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/rainy-window-reflections/1786827623755-ba0eaf6992fb.jpg",
    "Rainy Window Reflections",
    "Inspirational",
  ),
  makeCard(
    "https://files.sohozkaj.com/sohozkaj/ai-templates/wall-of-wisdom/1787045625092-8941b84a2342.jpg",
    "Wall Of Wisdom",
    "Inspirational",
  ),
  makeCard(
    "https://files.sohozkaj.com/sohozkaj/ai-templates/motivational-coach-quote-portrait/1787048909777-e6da15d4795c.jpg",
    "Motivational Coach Quote Portrait",
    "Inspirational",
  ),
  makeCard(
    "https://files.sohozkaj.com/sohozkaj/ai-templates/you-are-my-favorite/1787112653243-591997ce7199.jpg",
    "You Are My Favorite",
    "Inspirational",
  ),
  makeCard(
    "https://files.sohozkaj.com/sohozkaj/ai-templates/priceless-love-quote/1787114283320-85d53a34f3fc.jpg",
    "Priceless Love Quote",
    "Inspirational",
  ),
  makeCard(
    "https://files.sohozkaj.com/sohozkaj/ai-templates/golden-window-reverie/1787117413268-d4d601ebc1d7.jpg",
    "Golden Window Reverie",
    "Inspirational",
  ),
  makeCard(
    "https://files.sohozkaj.com/sohozkaj/ai-templates/faithful-love-poster/1787129104852-8334230ef222.jpg",
    "Faithful Love Poster",
    "Inspirational",
  ),
  makeCard(
    "https://files.sohozkaj.com/ai-templates/store-etiquette-poster/1786909186470-9206f6c404d2.jpg",
    "Store Etiquette Poster",
    "Inspirational",
  ),
  makeCard(
    "https://files.sohozkaj.com/sohozkaj/ai-templates/wisdom-quote-portrait/1787045891167-7aced945ea15.jpg",
    "Wisdom Quote Portrait",
    "Inspirational",
  ),
  makeCard(
    "https://files.sohozkaj.com/sohozkaj/ai-templates/motivational-quote-profile/1787054815901-b20f31e043c2.jpg",
    "Motivational Quote Profile",
    "Inspirational",
  ),
  makeCard(
    "https://files.sohozkaj.com/sohozkaj/ai-templates/bengali-love-illustration/1787119324085-b122b64a6aee.jpg",
    "Bengali Love Illustration",
    "Inspirational",
  ),
  makeCard(
    "https://files.sohozkaj.com/sohozkaj/ai-templates/golden-motivational-portrait/1787115532188-e77bdeb85781.jpg",
    "Golden Motivational Portrait",
    "Inspirational",
  ),
  makeCard(
    "https://files.sohozkaj.com/sohozkaj/ai-templates/playful-love-quote-portrait/1787119833238-34773a92a554.jpg",
    "Playful Love Quote Portrait",
    "Inspirational",
  ),
];

const sections: Section[] = [
  { id: "couple", title: "Couple portrait", cards: coupleCards },
  { id: "creative", title: "Creative Photos", cards: creativeCards },
  { id: "product", title: "Product advertising", cards: productCards },
  { id: "recovery", title: "Photo recovery", cards: recoveryCards },
  { id: "child", title: "Beautiful picture of a child", cards: childCards },
  { id: "birthday", title: "Happy birthday", cards: birthdayCards },
  { id: "family", title: "Family photo", cards: familyCards },
  { id: "greeting", title: "Greeting card", cards: greetingCards },
  { id: "fathers", title: "Father's Day", cards: fathersCards },
  { id: "victory", title: "Victory Day", cards: victoryCards },
  { id: "wedding", title: "Wedding photo", cards: weddingCards },
  { id: "inspirational", title: "Inspirational", cards: inspirationalCards },
];

const primaryFilters = [
  { label: "All photos", key: "all" },
  { label: "Creative Photos", key: "creative" },
  { label: "Product advertising", key: "product" },
  { label: "Photo recovery", key: "recovery" },
  { label: "Beautiful picture of a child", key: "child" },
];

const moreFilters = [
  { label: "Happy birthday", key: "birthday" },
  { label: "Family photo", key: "family" },
  { label: "Greeting card", key: "greeting" },
  { label: "Father's Day", key: "fathers" },
  { label: "Victory Day", key: "victory" },
  { label: "Wedding photo", key: "wedding" },
  { label: "Inspirational", key: "inspirational" },
];

const faqs = [
  [
    "What is an AI template?",
    "An AI template is a ready-made visual style that can be applied to your uploaded photo.",
  ],
  [
    "What do I need to do to use AI templates?",
    "Choose a style, upload your photo, and create the image from the selected template.",
  ],
  [
    "What type of image should I upload?",
    "Use a clear photo with a visible face and enough resolution for the template style.",
  ],
  [
    "Does it take credit to create AI images?",
    "Credits can be used depending on the template and the generation option you choose.",
  ],
  [
    "Can the created image be downloaded?",
    "Yes. After generation, your created image can be downloaded from the result screen.",
  ],
  [
    "How many types of AI templates are available?",
    "The library contains many templates across portraits, greetings, products, recovery, and more.",
  ],
];

function chunkIntoColumns<T>(items: T[], columnCount = 4) {
  const out: T[][] = Array.from({ length: columnCount }, () => []);
  items.forEach((item, index) => out[index % columnCount].push(item));
  return out;
}

function SearchIcon() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M16 16L21 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M4 6h16M7 12h10M10 18h4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChevronDown({ up = false }: { up?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{
        transform: up ? "rotate(180deg)" : undefined,
        transition: "transform .2s",
      }}
    >
      <path
        d="m6 9 6 6 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowUp() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 19V5M6.5 10.5 12 5l5.5 5.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function AITemplatePage() {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const filteredSections = useMemo(() => {
    return sections
      .filter((section) => active === "all" || section.id === active)
      .map((section) => ({
        ...section,
        cards: section.cards.filter((card) => {
          const haystack = `${card.title} ${card.category}`.toLowerCase();
          return haystack.includes(query.toLowerCase().trim());
        }),
      }))
      .filter((section) => section.cards.length);
  }, [active, query]);

  const selectFilter = (key: string) => {
    setActive(key);
    setMoreOpen(false);
    if (key !== "all") {
      setTimeout(
        () =>
          document
            .getElementById(key)
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        30,
      );
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <main className="ai-page">
      <section className="hero">
        <div className="hero-inner">
          <div className="count-pill">651+ AI templates</div>
          <h1>
            AI <span>Template</span>
          </h1>
          <p>
            Choose your favorite style, upload your photo — and get photos of
            the
            <br className="desktopOnly" /> same look in seconds.
          </p>

          <div className="search-wrap">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setQuery("");
              }}
              placeholder="Search by name or category..."
              aria-label="Search templates"
            />
            <kbd>Ctrl K</kbd>
            <button aria-label="Search">
              <SearchIcon />
            </button>
          </div>
        </div>
      </section>

      <div className="filter-bar">
        <div className="filter-inner">
          <div className="primary-filter-row">
            {primaryFilters.map((item) => (
              <button
                key={item.key}
                className={`filter-pill ${active === item.key ? "active" : ""}`}
                onClick={() => selectFilter(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="more-wrap">
            <button
              className="more-button"
              onClick={() => setMoreOpen((v) => !v)}
            >
              <FilterIcon />
              More categories
              <ChevronDown up={moreOpen} />
            </button>
            {moreOpen && (
              <div className="more-menu">
                {moreFilters.map((item) => (
                  <button key={item.key} onClick={() => selectFilter(item.key)}>
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="content-shell">
        {filteredSections.map((section) => {
          const columns = chunkIntoColumns(section.cards, 4);
          return (
            <section
              className="template-section"
              id={section.id}
              key={section.id}
            >
              <div className="section-head">
                <h2>{section.title}</h2>
                <button
                  className="see-all"
                  onClick={() => setActive(section.id)}
                >
                  See all <span>→</span>
                </button>
              </div>

              <div className="masonry-grid">
                {columns.map((column, colIndex) => (
                  <div
                    className="masonry-column"
                    key={`${section.id}-${colIndex}`}
                  >
                    {column.map((card) => (
                      <button
                        className="template-card"
                        key={card.image + card.title}
                      >
                        <img src={card.image} alt={card.title} loading="lazy" />
                        <span className="usage-badge">
                          Used {card.used} times
                        </span>
                        <span className="card-shade" />
                        <span className="card-caption">
                          <strong>{card.title}</strong>
                          <small># {card.category}</small>
                        </span>
                        <span className="create-button">
                          <ArrowUp /> Create in this style
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        {!filteredSections.length && (
          <div className="empty-state">
            <h3>No templates found</h3>
            <p>Try a different search word or category.</p>
            <button
              onClick={() => {
                setQuery("");
                setActive("all");
              }}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      <section className="faq-section" id="faq">
        <div className="faq-pill">FAQ</div>
        <h2>
          General inquiries <span>(FAQ)</span>
        </h2>
        <p>
          Answers to the most frequently asked questions about AI templates.
        </p>

        <div className="faq-list">
          {faqs.map(([question, answer], index) => {
            const open = openFaq === index;
            return (
              <button
                className={`faq-row ${open ? "open" : ""}`}
                key={question}
                onClick={() => setOpenFaq(open ? null : index)}
              >
                <span className="faq-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="faq-question">{question}</span>
                <span className="faq-icon">
                  <ChevronDown up={open} />
                </span>
                {open && <span className="faq-answer">{answer}</span>}
              </button>
            );
          })}
        </div>
      </section>

      <Footer />

      <style jsx global>{`
        :root {
          --orange: #ff9e0b;
          --orange2: #ff6a1a;
          --text: #171717;
          --muted: #6f7175;
          --page: #f5f5f6;
          --line: #e5e5e7;
          --navy: #101a2c;
        }

        * {
          box-sizing: border-box;
        }
        html {
          scroll-behavior: smooth;
        }
        body {
          margin: 0;
          background: var(--page);
          color: var(--text);
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }
        button,
        input {
          font: inherit;
        }

        .ai-page {
          min-height: 100vh;
          background: var(--page);
        }
        .hero {
          min-height: 347px;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          background:
            radial-gradient(
              circle at 38% 88%,
              rgba(190, 188, 255, 0.26),
              transparent 34%
            ),
            radial-gradient(
              circle at 72% 94%,
              rgba(255, 210, 171, 0.22),
              transparent 34%
            ),
            linear-gradient(180deg, #fbfbfc 0%, #f8f8f9 55%, #f7f7f8 100%);
          border-top: 1px solid #ededee;
        }
        .hero-inner {
          width: min(100%, 1000px);
          text-align: center;
          padding: 61px 24px 42px;
        }
        .count-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 18px;
          border: 1.5px solid #efb84f;
          border-radius: 999px;
          color: #c88911;
          font-size: 13px;
          font-weight: 700;
          background: #fffaf0;
        }
        .hero h1 {
          margin: 20px 0 17px;
          font-size: 42px;
          line-height: 1;
          letter-spacing: -1.6px;
          font-weight: 800;
        }
        .hero h1 span {
          color: var(--orange);
        }
        .hero p {
          margin: 0;
          color: #53565b;
          font-size: 16px;
          line-height: 1.45;
        }
        .search-wrap {
          width: min(100%, 434px);
          height: 53px;
          margin: 32px auto 0;
          border: 2px solid #efb84f;
          border-radius: 28px;
          background: white;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 13px 0 20px;
          box-shadow: 0 4px 13px rgba(0, 0, 0, 0.04);
        }
        .search-wrap input {
          min-width: 0;
          flex: 1;
          border: 0;
          outline: none;
          font-size: 14px;
          color: #4c4e53;
          background: transparent;
        }
        .search-wrap input::placeholder {
          color: #989a9e;
        }
        .search-wrap kbd {
          border: 1px solid #d8d1f9;
          background: #f4f2ff;
          color: #7c73c9;
          border-radius: 5px;
          font-size: 10px;
          font-weight: 800;
          padding: 5px 6px;
        }
        .search-wrap button {
          width: 24px;
          height: 24px;
          padding: 0;
          border: 0;
          background: none;
          color: #7d72d2;
          cursor: pointer;
          display: grid;
          place-items: center;
        }

        .filter-bar {
          position: sticky;
          top: 0;
          z-index: 20;
          background: rgba(255, 255, 255, 0.97);
          backdrop-filter: blur(12px);
          border-top: 1px solid var(--line);
          border-bottom: 1px solid var(--line);
        }
        .filter-inner {
          width: min(100%, 1000px);
          margin: 0 auto;
          min-height: 54px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 18px;
          padding: 7px 0;
        }
        .primary-filter-row {
          display: flex;
          flex-wrap: wrap;
          gap: 9px;
          align-items: center;
        }
        .filter-pill,
        .more-button {
          border: 1px solid transparent;
          background: #f0f1f4;
          color: #63666c;
          height: 33px;
          padding: 0 15px;
          border-radius: 999px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }
        .filter-pill.active {
          color: white;
          border-color: transparent;
          background: linear-gradient(90deg, #ff9d00, #d86cff);
        }
        .more-wrap {
          position: relative;
          flex: 0 0 auto;
        }
        .more-button {
          background: white;
          border-color: #dedfe4;
          display: flex;
          align-items: center;
          gap: 7px;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.02);
        }
        .more-menu {
          position: absolute;
          right: 0;
          top: 42px;
          width: 230px;
          padding: 8px 0;
          border: 1px solid #e1e1e4;
          background: white;
          border-radius: 9px;
          box-shadow: 0 12px 34px rgba(0, 0, 0, 0.11);
        }
        .more-menu button {
          width: 100%;
          border: 0;
          background: white;
          text-align: left;
          padding: 10px 15px;
          color: #55585e;
          font-size: 12px;
          cursor: pointer;
        }
        .more-menu button:hover {
          background: #fafafa;
        }

        .content-shell {
          width: min(100%, 1000px);
          margin: 0 auto;
          padding: 44px 0 74px;
        }
        .template-section {
          scroll-margin-top: 72px;
          margin-bottom: 42px;
        }
        .section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 0 0 16px;
        }
        .section-head h2 {
          margin: 0;
          font-size: 15px;
          font-weight: 800;
          letter-spacing: -0.25px;
        }
        .see-all {
          border: 0;
          background: none;
          color: #7469cc;
          font-size: 12px;
          cursor: pointer;
          font-weight: 600;
        }
        .see-all span {
          margin-left: 3px;
        }

        .masonry-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 18px;
          align-items: start;
        }
        .masonry-column {
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-width: 0;
        }
        .template-card {
          position: relative;
          display: block;
          width: 100%;
          padding: 0;
          margin: 0;
          overflow: hidden;
          border: 0;
          border-radius: 16px;
          background: #ddd;
          cursor: pointer;
          text-align: left;
          box-shadow: 0 1px 0 rgba(0, 0, 0, 0.03);
        }
        .template-card img {
          display: block;
          width: 100%;
          height: auto;
          object-fit: cover;
        }
        .template-card::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: 16px;
          box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.12);
          pointer-events: none;
        }
        .usage-badge {
          position: absolute;
          top: 9px;
          right: 9px;
          z-index: 3;
          padding: 4px 8px;
          border-radius: 999px;
          background: rgba(25, 25, 22, 0.74);
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          line-height: 1;
          backdrop-filter: blur(5px);
        }
        .card-shade {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          height: 54%;
          background: linear-gradient(
            to bottom,
            transparent 2%,
            rgba(0, 0, 0, 0.03) 20%,
            rgba(0, 0, 0, 0.72) 100%
          );
        }
        .card-caption {
          position: absolute;
          left: 12px;
          right: 10px;
          bottom: 11px;
          z-index: 2;
          color: #fff;
          display: flex;
          flex-direction: column;
          gap: 4px;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.38);
        }
        .card-caption strong {
          font-size: 11px;
          font-weight: 800;
        }
        .card-caption small {
          font-size: 9px;
          opacity: 0.95;
        }
        .create-button {
          position: absolute;
          z-index: 4;
          left: 50%;
          top: 51%;
          transform: translate(-50%, -50%) translateY(12px);
          opacity: 0;
          pointer-events: none;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 10px 13px;
          border-radius: 8px;
          background: rgba(255, 122, 35, 0.96);
          color: white;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          transition: all 0.18s ease;
          box-shadow: 0 7px 20px rgba(0, 0, 0, 0.17);
        }
        .template-card:hover .create-button {
          opacity: 1;
          transform: translate(-50%, -50%) translateY(0);
        }
        .template-card:hover img {
          filter: brightness(0.82);
        }

        .empty-state {
          min-height: 320px;
          display: grid;
          place-items: center;
          align-content: center;
          text-align: center;
        }
        .empty-state h3 {
          margin: 0 0 7px;
          font-size: 20px;
        }
        .empty-state p {
          margin: 0 0 15px;
          color: #777;
        }
        .empty-state button {
          border: 0;
          color: white;
          background: linear-gradient(90deg, #ff9d00, #ff7b27);
          padding: 10px 16px;
          border-radius: 9px;
          cursor: pointer;
          font-weight: 700;
        }

        .faq-section {
          background: white;
          border-top: 1px solid #eee;
          padding: 57px 24px 68px;
          text-align: center;
        }
        .faq-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 8px 18px;
          border: 1.5px solid #efb84f;
          border-radius: 999px;
          color: #c88911;
          background: #fffaf0;
          font-size: 12px;
          font-weight: 700;
        }
        .faq-section h2 {
          margin: 24px 0 18px;
          font-size: 31px;
          line-height: 1.05;
          letter-spacing: -0.7px;
        }
        .faq-section h2 span {
          color: #ef8511;
        }
        .faq-section > p {
          margin: 0 auto 34px;
          color: #56585c;
          font-size: 14px;
        }
        .faq-list {
          width: min(100%, 1000px);
          margin: 0 auto;
          text-align: left;
          display: grid;
          gap: 8px;
        }
        .faq-row {
          position: relative;
          width: 100%;
          min-height: 54px;
          padding: 0 16px;
          border: 1px solid #e2e2e4;
          border-radius: 11px;
          background: white;
          display: grid;
          grid-template-columns: 34px 1fr 24px;
          align-items: center;
          gap: 0;
          cursor: pointer;
          text-align: left;
        }
        .faq-row.open {
          grid-template-rows: auto auto;
        }
        .faq-index {
          font-size: 10px;
          font-weight: 800;
          color: #bcbec3;
        }
        .faq-question {
          font-size: 12px;
          font-weight: 700;
          color: #414348;
        }
        .faq-icon {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 1px solid #e3e3e5;
          background: #f9f9f9;
          display: grid;
          place-items: center;
          color: #8e9095;
        }
        .faq-answer {
          grid-column: 2 / 3;
          padding: 0 0 15px;
          color: #73757a;
          font-size: 12px;
          line-height: 1.55;
        }

        @media (max-width: 1080px) {
          .filter-inner,
          .content-shell {
            width: calc(100% - 36px);
          }
          .hero-inner {
            width: calc(100% - 24px);
          }
        }

        @media (max-width: 820px) {
          .masonry-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
          .filter-inner {
            align-items: flex-start;
            flex-direction: column;
          }
          .more-wrap {
            align-self: flex-end;
            margin-top: -42px;
          }
        }

        @media (max-width: 640px) {
          .hero {
            min-height: 310px;
          }
          .hero-inner {
            padding-top: 46px;
          }
          .hero h1 {
            font-size: 34px;
          }
          .hero p {
            font-size: 14px;
          }
          .desktopOnly {
            display: none;
          }
          .search-wrap {
            margin-top: 26px;
            width: 100%;
          }
          .filter-inner {
            gap: 10px;
            padding: 10px 0;
          }
          .primary-filter-row {
            flex-wrap: nowrap;
            overflow: auto;
            width: 100%;
            padding-bottom: 2px;
          }
          .filter-pill {
            flex: 0 0 auto;
          }
          .more-wrap {
            align-self: flex-start;
            margin-top: 0;
          }
          .content-shell {
            width: calc(100% - 24px);
            padding-top: 34px;
          }
          .masonry-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
          }
          .masonry-column {
            gap: 10px;
          }
          .template-card,
          .template-card::after {
            border-radius: 12px;
          }
          .usage-badge {
            top: 7px;
            right: 7px;
            font-size: 8px;
          }
          .card-caption {
            left: 9px;
            right: 8px;
            bottom: 9px;
          }
          .card-caption strong {
            font-size: 9px;
          }
          .card-caption small {
            font-size: 8px;
          }
          .faq-section {
            padding-left: 12px;
            padding-right: 12px;
          }
          .faq-section h2 {
            font-size: 26px;
          }
          .faq-list {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
