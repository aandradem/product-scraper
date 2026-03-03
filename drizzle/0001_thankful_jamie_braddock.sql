CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`sourceUrl` text NOT NULL,
	`name` text,
	`description` text,
	`price` varchar(100),
	`currency` varchar(10),
	`images` text,
	`specifications` text,
	`nutritionalInfo` text,
	`metaTitle` text,
	`metaDescription` text,
	`metaKeywords` text,
	`rawHtml` text,
	`extractedData` text,
	`status` enum('pending','success','error') NOT NULL DEFAULT 'pending',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;