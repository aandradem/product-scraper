ALTER TABLE `products` ADD `originalPrice` varchar(100);--> statement-breakpoint
ALTER TABLE `products` ADD `sku` varchar(100);--> statement-breakpoint
ALTER TABLE `products` ADD `category` text;--> statement-breakpoint
ALTER TABLE `products` ADD `brand` varchar(255);--> statement-breakpoint
ALTER TABLE `products` ADD `availability` varchar(50);--> statement-breakpoint
ALTER TABLE `products` ADD `availabilityQuantity` int;--> statement-breakpoint
ALTER TABLE `products` ADD `variants` text;--> statement-breakpoint
ALTER TABLE `products` ADD `rating` varchar(10);--> statement-breakpoint
ALTER TABLE `products` ADD `reviewCount` int;--> statement-breakpoint
ALTER TABLE `products` ADD `reviews` text;--> statement-breakpoint
ALTER TABLE `products` ADD `weight` varchar(50);--> statement-breakpoint
ALTER TABLE `products` ADD `dimensions` text;--> statement-breakpoint
ALTER TABLE `products` ADD `shippingTime` varchar(100);