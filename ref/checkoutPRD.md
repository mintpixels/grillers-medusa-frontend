Jan 28, 2026

## Chris / Avi

Invited [Chris Bollman](mailto:chris@humancode.io) [Avi Swerdlow](mailto:aviswerdlow@gmail.com)

Attachments [Chris / Avi](https://www.google.com/calendar/event?eid=bmltMG5tZzAxaTJscjlyZHNndGUyOHQ3N2MgYXZpc3dlcmRsb3dAbQ) 

Meeting records [Transcript](?tab=t.978a92na2vjw) [Recording](https://drive.google.com/file/d/10zTRxeSQQJguP166_aIjA9zemRjhhv94/view?usp=drive_web) 

### **Summary**

Chris Bollman and Avi Swerdlow agreed to focus on the checkout flow, including the post-purchase experience, using the Shopify checkout as the standard and defining four types of pickup/delivery options, where the presentation of these choices must be gated by the user's zip code and minimum order thresholds. The discussion covered how to address user addresses, edge cases for shipping addresses, system logic for fulfillment and blackouts, and the need for a custom interface outside Strappy for managing operational data. The speakers also outlined the UX for scheduling delivery and pickup, the complex shipment scheduling logic, and the critical requirement for customers to create an account to save credit card information for future charges, concluding with a plan for the post-purchase experience flow to bifurcate based on the fulfillment method.

### **Details**

* **Meeting Scope and Approach** Chris Bollman and Avi Swerdlow agreed to focus the discussion on the checkout flow, including the post-purchase experience ([00:00:00](?tab=t.978a92na2vjw#heading=h.xuuyneq95ikx)). Avi Swerdlow proposed working in Figma, with Chris Bollman potentially driving, to visualize screens. Chris Bollman stated that after the discussion, they would return with a solution representing what was talked about ([00:01:02](?tab=t.978a92na2vjw#heading=h.3misszpfn2i1)).

* **Checkout Starting Point and Standard** The discussion's launch point was defined as hitting 'checkout' from the side cart ([00:01:52](?tab=t.978a92na2vjw#heading=h.vj3zkj1l4h16)). Chris Bollman suggested using the Shopify checkout as the standard for their checkout flow, noting that they would need to change enough about the standard Medusa checkout to justify building a custom solution ([00:04:07](?tab=t.978a92na2vjw#heading=h.mjapctr4115n)) ([00:06:59](?tab=t.978a92na2vjw#heading=h.z8uuho9lwnkf)).

* **Defining Pickup and Delivery Options** Avi Swerdlow listed four types of pickups/deliveries: plant pickup (Atlanta), Atlanta delivery, nationwide shipping, and co-op Southeast pickup points ([00:10:36](?tab=t.978a92na2vjw#heading=h.qql6p0zk4g0)). Chris Bollman noted that a key decision is where to present these choices in the flow, using a previous project example (Finley) where these decisions were made before the checkout to avoid overwhelming the process ([00:06:59](?tab=t.978a92na2vjw#heading=h.z8uuho9lwnkf)).

* **Addressing User Address and Service Availability** The speakers discussed how knowing the user's address (specifically the zip code) can eliminate pickup/delivery options ([00:10:36](?tab=t.978a92na2vjw#heading=h.qql6p0zk4g0)). They determined that if a user is logged in, the system would presume the last order address as the default ([00:13:33](?tab=t.978a92na2vjw#heading=h.66sjba4rw9pw)). For Atlanta customers, the options would be pickup versus delivery, while non-Atlanta customers would see shipping options relevant to their location or Southeast pickup ([00:12:14](?tab=t.978a92na2vjw#heading=h.k3gvepjyashm)).

* **Edge Cases for Shipping Address** The team addressed the edge case of a customer ordering for a friend or different location than their default address, agreeing that the system should clearly focus on the shipping address, similar to Amazon's door model ([00:12:14](?tab=t.978a92na2vjw#heading=h.k3gvepjyashm)). Chris Bollman emphasized that the billing address is irrelevant for pickup options, including Southeast pickup ([00:15:41](?tab=t.978a92na2vjw#heading=h.8lil2nlgo8je)).

* **Minimum Order Thresholds and Gating** Avi Swerdlow brought up the need for minimum order thresholds, particularly for free delivery, and how to display these tradeoffs to the user ([00:20:22](?tab=t.978a92na2vjw#heading=h.d5m2drex2wjd)). Chris Bollman proposed gating the cart by type of acquisition (shipped or delivered) and displaying a note on the screen, if necessary, indicating the minimum order requirement and how much the user is away from meeting it ([00:21:51](?tab=t.978a92na2vjw#heading=h.fk2bp4yrk8sn)).

* **User Experience for Option Tradeoffs** Avi Swerdlow stressed the importance of allowing users to easily go back and change their selected options (e.g., from delivery to plant pickup) to evaluate the tradeoffs effectively ([00:23:54](?tab=t.978a92na2vjw#heading=h.43g4o3meii3c)). Chris Bollman agreed, confirming the need to defend the user's ability to see and switch between options ([00:24:36](?tab=t.978a92na2vjw#heading=h.7n6nhmsyd547)).

* **System Logic for Fulfillment and Blackouts** Chris Bollman confirmed that the logic for available pickup and delivery dates, including holiday blackouts and delivery days for Atlanta, is already accounted for in Strappy ([00:24:36](?tab=t.978a92na2vjw#heading=h.7n6nhmsyd547)). Chris Bollman also showed that shipping zones, zip codes, and tiered shipping rates matching the business's specifications are configured in Strappy ([00:27:43](?tab=t.978a92na2vjw#heading=h.8tg6805of6c3)).

* **Management Interface for Operational Data** Both speakers agreed that managing critical data, such as shipping blackout dates and rates, should be done outside of Strappy's main interface to prevent errors, suggesting a Chrome plugin or small custom app for the owner to use ([00:26:05](?tab=t.978a92na2vjw#heading=h.utiyzft5xrgt)). This custom interface would be implemented post-launch ([00:28:59](?tab=t.978a92na2vjw#heading=h.c7kbnbbaffh1)).

* **UX for Scheduling Delivery and Pickup** Avi Swerdlow discussed displaying a date picker for scheduling, noting that Atlanta deliveries would likely offer a window (e.g., a specific night between 6:00 and 9:00 p.m.) ([00:29:58](?tab=t.978a92na2vjw#heading=h.7a10oq7kic7y)). The UX for Southeast deliveries would be different, focusing on selecting from available dates which may be once a month or less frequent ([00:31:01](?tab=t.978a92na2vjw#heading=h.a9zbzivf939w)). Chris Bollman affirmed the need for the owner to set dates and cutoff times for Southeast pickup points and agreed that Southeast pickup should display available dates rather than a full calendar due to the limited frequency ([00:31:58](?tab=t.978a92na2vjw#heading=h.raf0gx8726nj)).

* **Shipment Scheduling Logic** Avi Swerdlow outlined the complex shipping rules based on delivery time (three-day, two-day, or overnight) and the need to ship early in the week due to weekends ([00:35:31](?tab=t.978a92na2vjw#heading=h.ty5qhp1kb65s)). The customer-facing UX would only show available *receive* dates, abstracting the internal shipping schedule complexities ([00:36:40](?tab=t.978a92na2vjw#heading=h.xrrhx98jvecr)).

* **Handling Holiday and Inventory Constraints** The discussion touched upon the complexity of holiday-specific orders, such as Passover, and how that impacts plant conversion and inventory fulfillment ([00:39:08](?tab=t.978a92na2vjw#heading=h.syrc5um91kzy)). Avi Swerdlow raised the question of whether the system should be purely inventory-driven or if certain items have fixed delivery dates regardless of stock. Chris Bollman identified this as a critical question for the business owner ([00:40:58](?tab=t.978a92na2vjw#heading=h.fqkbl748fh86)).

* **Checkout Page Structure and Login Requirement** Chris Bollman suggested that after answering initial questions, the user enters a sleek checkout page that mirrors Shopify's design, with the cart summary on the right and no site navigation ([00:42:49](?tab=t.978a92na2vjw#heading=h.ud57ej4qkmr7)). They agreed that customers must create an account to proceed, as credit card information needs to be saved for future catch weight charges ([00:43:50](?tab=t.978a92na2vjw#heading=h.sym9dhf0mlo0)).

* **Post-Purchase Experience Flow** Avi Swerdlow proposed that the post-purchase experience (emails, follow-up communications) should bifurcate based on the fulfillment method (pickup, local delivery, shipping, Southeast pickup). This includes specific instructions, estimated times, and reminders tailored to each method, such as when an order is ready for pickup or when local delivery will occur ([00:45:31](?tab=t.978a92na2vjw#heading=h.1tbkoa909d53)).

* **Future State Communication and Customer Account** Chris Bollman suggested future functionality for local delivery, like the ability for the driver to signal when they are "on my way" via a simple interface, triggering an email or text update to the customer ([00:46:27](?tab=t.978a92na2vjw#heading=h.4snk24dksln)). They also emphasized that customers need to be able to view past orders, their status, and details in their account ([00:47:13](?tab=t.978a92na2vjw#heading=h.4m3wdi9gcxit)).

* **Next Steps and Action Items** Chris Bollman planned to quickly build a proof of concept (POC) of the flow with mock data to review before starting implementation and UI/UX final touches with Dave ([00:48:15](?tab=t.978a92na2vjw#heading=h.a919igvosfnt)). Avi Swerdlow confirmed that they would provide Chris Bollman with the transcript and the notes document .

### **Suggested next steps**

- [ ] Chris Bollman will come back with a solution this week of representing what was talked about in the meeting and then build a proof of concept with mock data for the checkout flow to ensure it works well before implementation.

- [ ] Avi Swerdlow will call his dad to get the bank account information for the Stripe integration.

- [ ] Avi Swerdlow will send the transcript and add Chris Bollman to the shared document.

*You should review Gemini's notes to make sure they're accurate. [Get tips and learn how Gemini takes notes](https://support.google.com/meet/answer/14754931)*

*Please provide feedback about using Gemini to take notes in a [short survey.](https://google.qualtrics.com/jfe/form/SV_9vK3UZEaIQKKE7A?confid=A1n7n-192EyOp7najXrRDxIQOAIIigIgABgBCA&detailid=standard)*