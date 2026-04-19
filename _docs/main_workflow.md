# Current Workflow for the lawfirm, along with some insight as to how this will be changed


# ***Lead Intake***

1. conflict check (search across all systems)
2. assign to firm (manual based on matter type -> makase auto assign)
3. assign to attorney (flock -> gchat)
4. call to schedule (manual google calendar)
5. create client file (dropbox -> google drive)
6. add to list of clients (hubspot)
7. send consultation agreement (adobe sign -> google sign)
8. add signed consult agreement to client file (dropbox -> hubspot)



### **1) Conflict check**
- how is conflict check done?
 - dropbox
 - calendar
 - hubspot
 - asana


### **2) Assign to firm**
- Tresp Law - estate planning, trust admin, litigation
- TDA - Asset protection, offshore, business law

### **3) Assign to attorney**
- Manual for now.

- Who decides this?


### **4) Call to schedule**
- 3 consults per day per attorney
- check what office they will be at for in person
  - could put them in two seperate gcal links and send based on PC location preference
  - put notes on client in the calender link for the attorney (not viewable by client)


### **5) Create client file for consult**
- make folder with client name and attorney initials (dropbox -> google drive)

### **6) Add to list of clients**
- added to list of clients (hubspot -> makase)
  - Added as a prospective client distinct from actual clients?


### **7) Consultation agreement**
- standard document client signs (adobe -> google sign)
- emailed out manually by reception


### **8) add signed consult agreement to client file**
- this closes out the reception tasks and passes off to attorney
- reception enters time into bigtime to keep track but it is not tied to client file



------------
# **-->Matter Created in stage 'consultation'**
- not currently done at this point in bigtime or asana but it really does designate start of confidential info etc.
- in makase this is the step where the matter will be created 
- any time tracked from now on can be marked as billable and associated with the matter.
------------

# ***Prospective Client - Consultation***

1. Consultation
2. Fee agreement - if yes to case, fee agreement drafted
3. Client makes payment (lawpay/check -> stripe/check)
4. Attorney signs fee agreement

### **1) Consultation**
- figure out if want to take the case
- time entered into bigtime as billable but no charge

- is this time entered against a matter in bigtime?

### **2) Fee agreement - if yes to case, fee agreement drafted**
- some fee agreement is flat, some hourly, some both (manually select from templates)
- copy paste scope, amount, attorney name into fee agreement (MS Word)
- draft agreement added to PC folder (dropbox -> google drive)
- sent to elizabeth to approve fee agreement (notify her via flock -> gchat)
- fee agreement sent out

### **3) Client makes payment**
- client clicks link from fee agreement, enters amount manualy and pays (lawpay -> stripe)


### **4) Attorney signs fee agreement**
- Only happens after firm validates payment
- This begins the attorney client relationship
- Client moved from prospective_client to client on matter
- matter moved from 'consult' to 'active'?

------------
# **-->Matter moved to stage: 'setup'**
------------

# ***Client Setup***
1. client setup
2. create matter (bigtime, asana -> makase)

### **1)Create matter (bigtime)**
- start date set to date they paid fee agreement
- billing type based on matter but occasionally different so needs to be manually editable
- referral source, referal source notes (for specific names, google ad id etc.)
- client data added as client and as primary contact, any secondary clients added as contacts
- assign team 
  - always elizabeth tresp as principal attorney
  - assigned attorney as responsible attorney
  - everyone from team associated with the matter type is automatically assigned to matter as well and can bill to it
- select rates based on fee agreement
- send matter id (client code) to flock to let everyone know

### **2)Create Matter in asana**
- create new project in asana with matter id (client code) in the title
- asign first task in project to responsible attorney (this first task is called assign tasks and is to divide up the work to the team)
- same team added to this as bigtime + heather and mcclain
- create setup task assigned to responsible attorney 
- create other tasks as defined by template for this matter type
- attorney assigns other tasks to themself / other team members
- paralegal goes in and manually writes up a summary of the case and saves to asana project overview
  - this summary is currently the main source of truth for data points on the case
- paralegal assigned to enter all information into asana


### **3)update client file**
- move client folder into clients - active (dropbox -> google drive)
- add case templates in to this folder

### **4)Create client entity**
- update prospective client -> active client (hubspot -> makase)
  - we will add entry to entity_roles table with role_type as 'client'
  - other entry with role_type as 'prospective client remains'

### **5)Notify team client has been set up**
- receptionist sends message to team that setup is done (flock)

### **5)receptionist finalizes time entry for client setup in bigtime**
- enter in matter, category, no charge override, notes

--------------
# **-->Matter moved to stage: 'active'**
--------------

# ***Working the case***
- matter type dependent

## **Case Status**
- case health
  - summary of where its at
  - last contact w/ client
  - next hearing / court date
  - billing / profitability / AR
  - need to show pretty much every page of the case

## **Case File**
- google drive, need to decide on strict structure and organization
- auto import emails and email attachments

- how are text messages / info from phone calls saved to client file?


## **Client Meetings**
- transcription of meetings
- template of what points need to be adressed for meeting
- real time check off data points that have been collected and reminder


## **Task Tracking**
- status updates and summaries
- setting task for next person by selecting due date 

- task templates with dependencies. Auto set due date for next task when the one they depend on is completed



## **Case Chat**
- Google chat space per case "Client Name [case_id]"

## **Probate**
- Form driven

---------------------------------
# **Finish the case**


## **Move the case file**
- move case file from active to archived
- 

## **Close court case**
- make sure the case has been closed out with the court
- different for every case type
- 

## **Close Representation**
- paralegal sets tasks to compose closing letter (asana)
  - closing letter summarizes case and what was done (typically matches fee agreement)
  - with the closing letter, send back original documents, final invoice
- task to reconcile accounting
  - with closing letter send check with final balance of trust etc.


## **Archive Matter in Big time**
- once everything is paid up, it gets archived in big time



## **Client relationship**

----------------------------------

# ***Billing***

### **expenses**
- process:
  - select matter or project (if matter it autochecks billable but still need to be able to uncheck billable)
  - select if its reimbursable (only when a personal card was used)
  - upload picture of receipt
- other system invoices
  - one legal
  - deadlines.com


### **time tracking**
- rounded up per task
- billed per task
- fields
  - matter_id
  - billable? // go towards an attorneys "billable hours"
  - no charge? // only shows up for billable tasks. go towards an attorneys "billable hours" but dont get charged to a client and dont require a matter id
  - invoice_id // added to invoice (the invoice itself will have a status)
- matter selected -> autochecks billable
- consult -> autochecks billable, autochecks no charge
- time tracking must be modifiable


### **invoices**
- clients billed on 4 week cycles
- two groups of clients billed every 2 weeks
- no invoices necessary under $13.50
- some matters such as probate should not be invoiced
- when bill aproaches the amount of the deposit they are billed immediately
- modifying on the invoice modifies the core time tracking data / expense data
  - statuses: drafted, approved, sent, paid/closed, 
  - terms -> set due date
  - sent date
  - billing notes
- Manually add payment on invoice
  - add payment to client and have it apply to invoices starting with the oldest one
  - payments table, invoice_payment_applied table or something like that
- payment due 10 days out
  - reminder over email or text
  - days 3,6,9
  - once overdue its 10% extra. need to be able to waive late fee
- Payment reminders on mondays
  - if payment via stripe is auto applied everything should stay up to date.

### **billing types**
- active billing - send every two weeks
- active / deferred billing - invoice at end of case
- flat fee - billed at beginning
- flat fee + hourly - billed at beginning and then every two weeks after they go over
  - show if they are close to depleting flat fee 
- contingency - billed based on result of case

### **reporting**
- 
