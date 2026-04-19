
## **plan of attack**
- What order should things be done
  - v0 (essentials): flexible bigtime + asana
    - really just need to replicate asana so they can use this now. 
    - all data stored in client file within google drive
    - at this point a matter is really just a text feild sumarizing the data stored in client file
    - focus is full time tracking functionality so they can get off of big time
  - v1 (full functionality):
    - data layer
    - task templates
    - specific matter types
    - reporting dashboards
    - client outreach / marketing campaigns
  - v2 (automation):
    - auto summarize matter
    - auto assign tasks
    - auto save emails / attachments
    - auto generate google chat space per case
    - auto draft documents
  - vX:
    - client portal

## **Two-firm boundary:**
- Can a single matter ever involve both firms? Or is a matter always scoped to exactly one?
  - always scoped to exactly one. Occasionally a lead will come in and get moved to another firm. Eventually we may need to be able to transfer leads between firms but for now this is out of scope. The lead will just have to be recreated in the correct place. 
- How are leads placed into one firm or another. Do they ever come in to one and get assigned to the other?
  - there are general rules about what types of cases go where but on the edge it is sometimes a judgement call. Sometimes they come in through one firm and get moved to the other one
- Can the same entity (person/org) appear in both offices?
  - yes, this sometimes happens and they may have different role for each office
- Is entity data shared across offices? Should conflict check be run on both offices?
  - the data is not shared between offices, it is owned by one firm and the same person coming to another firm will end up with a new entity record for that firm
  - Conflict checks may need to check between firms but any data from other firms will be redacted unless the user viewing it has access to both firms. 
- Do attorneys ever work matters across both firms simultaneously?
  - yes attorneys may need access to switch between multiple firms
- For reporting -- do we need a consolidated cross-firm view, or always per-firm?
  - always per firm for now, but eventually we will add cross-firm reporting and possibly tasks etc.

## **Task system:**
- How should tasks be displayed?
  - V0: Tasks can be viewed per lead / matter / client tightly integrated with time tracking
  - v1: A dedicated filterable tasks page / inbox for seeing all your assigned tasks and time tracked against them.
  - v2: task groupings: tasks can be grouped for display in ui and high level reporting (seperate task group table, doesn't change core tasks / time tracking mechanism)
- How are tasks created for leads?
  - Since lead intake is pretty linear, a single task called 'lead intake' will be created for each lead that comes in and everything else can be directly tracked within the leads page
- how are tasks created for matters?
  - A matter may have 4 different tasks that could be done in parallel so these make sense to track as individual tasks
  - v0: Custom tasks are created from within a matter and assigned to that matter. 
  - v1: Template defines what tasks will be created based on matter type. 
  - v2: Tasks are auto marked ready when the tasks they depend on are completed
- What fields does a matter task have? (status options, priority levels, categories, billable?)
  - This will be flexible, based on asana + bigtime
  - TODO: map this out exactly. thouhts:
    - a status such as 'pending', 'ready', 'active', 'done'. 
    - v1: priority levels
    - v2: categories 
  - any matter specific data collected directly on matter
- How many task templates exist, and for which matter types? Can you provide one complete example template?
  - these are in asana
  - TODO: go through asana and decide how we want to implement templates
- When tasks are auto-assigned "by role" at activation, what's the mapping?
  - first task on a matter is assigning all the tasks.
  - responsible attorney will be auto assigned first task and then decides who does what
  - v2: Assign to individual per matter so same person does all tasks in their role for that matter?

## **Billing model:**
- How is the client deposit tracked? Stripe or a simple prepayment ledger?
  - TODO: see how this is currently done in big time
  - v0: manual entry
  - v1: stripe / lawpay dependent on matter type
- What defines the A/R calculation? Is it `total_billed - total_paid` vs the original deposit? Or cumulative?
  - total billed - total paid
- What does a billing cycle look like end-to-end? Internal invoices are generated every 2 weeks -- generated from what? All unbilled time entries since last internal invoice?
  - depends on the billing type for the matter.

## **Matter types and their data:**
**TODO: nail these down for v1 data layer.**
- What is the complete list of matter types? (So far we have: Estate Planning, Probate, Trustee Rep, Asset Protection, Business Entities)
- For each matter type, what are the type-specific fields?
  - [Schema stores these in `matters.data` as JSONB, but need to define the shape per type]
- What are the high level status options for a matter (common across all matter types)?
  - Pending, Open,  Closed
- Do matters have well defined stages (e.g., filing, discovery, trial)
  - Are these stages defined per matter type or across all matters?
  - What are the fine grain stages for each matter type? (specific to each matter type)
- Should matters view be a filterable list of matters, kanban board, or both (if both what is priority)
  - leaning toward list; faster to implement and easier to display data but text heavy / less visual
- How should matters be grouped?
  - One view for all matters (with filtering by matter type). Fine grain status displayed for each matter
  - OR different views for each matter type grouped by fine grain stage
- What is the list of tasks for each matter type?

## **Fee agreements:**
**TODO: nail these down for v1 data layer.**
- Can you provide the 13 fee agreement template variants and the full field list?
- How does matter type map to fee agreement template? Is it 1:1 or many-to-many?


## **Lead sources -- technical delivery:**
- For AVVO, SDCBA, Google LSA, Google Ads: how do leads currently arrive? (Email to a specific inbox? Webhook to a URL? CSV export?) We need to know the actual integration mechanism per source.
  - email / asana rules. brian set these up so will do a deep dive with him when we get to it.
- Can you provide the current Asana email rules you use? That's the spec for what we need to replicate.
  - should be abailable in asana

## **Client portal**
- How do clients log in? Email magic link? Username/password? The internal team uses Supabase Auth with OTP
  - defered: can do a deep dive on client portal when we get there (v2 scope)
- Can a client see matters across both firms if they're a client of both? or should they be logging into a different dashboard per firm?
  - defered, but maybe eventually they can access any firm in makase network


## **Call tracking:**
- Is call tracking (initiate from Makase, record, transcribe, log time) Phase 1? This requires telephony integration (Twilio or similar) which is a significant new integration not listed elsewhere.
  - Not phase 1 but would be great to have at some point


## **Google Chat:**
- "Replace Flock with Google Chat" - what is flock currently used for?
  - Internal communication
  - currently they just message in the main group with client last name before each message
  - Per case threads could be helpful
  - v2: Makase links to chat threads from matter records?


## **Mail scan automation:**
- How does scanned mail enter the system today? Is there a scanning service that emails PDFs? A network scanner with an API? This determines whether "auto-route to correct client folder" is an email parsing problem or a device integration problem.
  - v1: manual scan and add to client file in google drive
  - v2: batch scan to file, auto suggest correct client folder, one click accept to move it to the correct folder OR decline and select correct matter  

# ***Further Questions***

## **Notification channels:**
- When you say "notify" -- which channels for which events? (In-app only? Email? SMS? All three?)
- Who exactly receives each notification type? (The attorney on the matter? All attorneys? The receptionist? The paralegal?)
- Are there urgency tiers? (e.g., A/R at 100% is more urgent than "new lead arrived")

### Specific questions for lead intake

1. **Entity matching:** Should exact match be on phone AND email, or just phone?
  - v1: search both and display results
  - v2: decide on more advanced algorithm that can auto conflict check in most situations
2. **Previous clients as conflicts:** Should being a previous client in another matter be treated as a conflict?
  - v1: display results and human decides what a conflict is
  - v2: probably not but may want to flag this 
3. **Scheduling vs fee agreement ordering:** Should scheduling happen before or after the fee agreement is sent? The current plan sends the scheduling link first, then the fee agreement on booking -- but the scope CSV says "consult agreement auto-sent the moment a consultation is booked" and also "fee agreement drafting tool." Are the consult agreement and the fee agreement the same document or different? 
  - Scheduling link goes out, followed by the consultation agreement on booking.
  - Fee agreement is different and comes after consultation

---

### Data migration questions

- How many records are in HubSpot, Dropbox, BigTime, and Asana? (Order of magnitude matters for estimating migration effort.)
- What's the cutover strategy? Big bang switchover on a weekend, or gradual migration running both systems in parallel?
- Which historical data must be migrated vs. just archived? (e.g., do all past BigTime invoices need to be queryable in Makase, or just exported as PDFs?)
- Is there a universal ID across those systems today, or will migration require manual mapping?
  - big time has an id that is used in asana project name but i dont think this matches hubspot or dropbox client file
