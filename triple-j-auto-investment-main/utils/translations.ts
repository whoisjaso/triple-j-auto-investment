export type Language = 'en' | 'es';

export const t = {
    en: {
        nav: {
            home: "Home",
            inventory: "Inventory",
            services: "Services",
            about: "About",
            contact: "Contact",
            financing: "Financing",
            login: "Login",
            admin: "Admin"
        },
        footer: {
            tagline: "Trusted pre-owned vehicles for Houston families.",
            quickLinks: "Quick Links",
            contact: "Contact Us",
            legal: "Legal",
            privacy: "Privacy Policy",
            terms: "Terms of Service",
            rights: "All rights reserved.",
            location: "Our Location",
            address: "8774 Almeda Genoa Road",
            city: "Houston, Texas 77075",
            phone: "(832) 400-9760",
            phoneLabel: "Call Us",
            hours: "Hours",
            hoursDetail: "Mon-Sat 9AM-6PM",
            closed: "Closed Sunday",
            dealerLicense: "Dealer License",
            followUs: "Follow Us",
            copyright: "Triple J Auto Investment"
        },
        common: {
            callAgent: "Call Us",
            viewAll: "View All",
            loading: "Loading...",
            price: "Price",
            mileage: "Mileage",
            year: "Year",
            status: "Status",
            available: "Available",
            sold: "Sold",
            pending: "Pending",
            asIs: "(AS-IS)",
            expressInterest: "I'm Interested",
            phone: "(832) 400-9760",
            backToHome: "Back to Home",
            contactUs: "Contact Us",
            learnMore: "Learn More",
            getDirections: "Get Directions",
            sendMessage: "Send Message",
            viewInventory: "View Inventory",
            forRent: "For Rent",
            forSale: "For Sale",
            saleAndRental: "Sale & Rental",
            perDay: "/day",
            perWeek: "/week",
            bookNow: "Book Now",
            rentalRates: "Rental Rates",
            dailyRate: "Daily Rate",
            weeklyRate: "Weekly Rate",
            allListings: "All Listings",
            listingType: "Type"
        },
        home: {
            hero: {
                heading: "TRIPLE J AUTO INVESTMENT",
                subheading: "AUTOMOTIVE INVESTMENT FIRM",
                tagline: "Reliable pre-owned vehicles for Houston families. Transparent pricing, in-house financing, no surprises.",
                scheduleVisit: "Schedule a Visit",
                callNow: "Call Now",
                scrollPrompt: "Explore"
            },
            authority: {
                title: "TRUSTED BY HOUSTON FAMILIES",
                familiesServed: "Families Served",
                fiveStarReviews: "Five-Star Reviews",
                yearsInBusiness: "Years Serving Houston",
                vehiclesDelivered: "Vehicles Delivered"
            },
            seHabla: "Se Habla Espanol",
            ticker: [
                "SERVING HOUSTON FAMILIES",
                "TRANSPARENT PRICING",
                "SE HABLA ESPANOL",
                "PRE-OWNED VEHICLES $3K-$8K",
                "SALES & RENTALS"
            ],
            arsenal: {
                title: "Our Inventory",
                subtitle: "Featured Vehicles",
                desc: "Browse our hand-picked selection of reliable pre-owned vehicles.",
                viewAll: "View Full Inventory"
            },
            pillars: {
                title: "Why Triple J",
                subtitle: "Our Promise to You",
                p1Title: "TRUST",
                p1Desc: "Every vehicle is inspected and verified before it reaches our lot. We stand behind what we sell.",
                p1Highlight: "Your confidence matters.",
                p2Title: "SIMPLICITY",
                p2Desc: "No hassle, no hidden fees. Our buying process is designed to be fast and straightforward.",
                p2Highlight: "Easy from start to finish.",
                p3Title: "VALUE",
                p3Desc: "Quality vehicles at honest prices. Every car is selected for reliability and priced fairly.",
                p3Highlight: "Real value, real savings."
            },
            cards: {
                vetting: {
                    title: "Vehicle History",
                    desc: "Every vehicle comes with a full history check. Know exactly what you're getting before you buy.",
                    cta: "VIN Lookup"
                },
                psych: {
                    title: "Our Story",
                    desc: "A family-run dealership built on trust. We treat every customer the way we'd want to be treated.",
                    cta: "About Us"
                },
                velocity: {
                    title: "Fast & Simple",
                    desc: "From browsing to driving -- our streamlined process gets you on the road quickly and confidently.",
                    cta: "Ready to Go"
                }
            },
            vault: {
                access: "Ready to Find Your Car?",
                title: "BROWSE ALL",
                enter: "View Inventory"
            },
            signals: {
                label: "What We Offer",
                items: [
                    "OPEN MON-SAT 9AM-6PM",
                    "SERVING HOUSTON FAMILIES",
                    "TRANSPARENT PRICING ON EVERY VEHICLE",
                    "PRE-OWNED VEHICLES $3K-$8K",
                    "VEHICLE SALES & RENTALS",
                    "SE HABLA ESPANOL",
                    "FINANCING AVAILABLE"
                ]
            },
            architecture: "What Sets Us Apart"
        },
        inventory: {
            title: "Our Vehicles",
            subtext: "Browse Available Vehicles",
            sort: "Sort Order",
            filter: "Status Filter",
            searchPlaceholder: "Search by Make/Model...",
            noResults: "Loading vehicles...",
            modal: {
                tabs: {
                    overview: "Overview",
                    specs: "Specs & Report",
                    transparency: "Condition",
                    purchase: "Inquire"
                },
                submit: "Send Inquiry",
                submitting: "Sending...",
                successTitle: "Message Sent",
                successMsg: "Our team has received your inquiry. We will contact you shortly with more details.",
                disclaimer: "By submitting, you acknowledge this vehicle is sold AS-IS without warranty.",
                return: "Back to Inventory",
                form: {
                    name: "Full Name",
                    phone: "Phone Number",
                    email: "Email Address"
                },
                specs: {
                    make: "Make",
                    model: "Model",
                    exterior: "Exterior",
                    interior: "Interior",
                    paintFinish: "Paint Finish",
                    bodyIntegrity: "Body Integrity",
                    glassOptics: "Glass / Optics",
                    inspected: "Inspected",
                    upholstery: "Upholstery",
                    controlsElectronics: "Controls & Electronics",
                    climateSystem: "Climate System",
                    functional: "Functional"
                },
                conditionReport: "Condition Report",
                viewFullReport: "View Full Report",
                noIssues: "No major issues reported",
                moreNoted: "more noted",
                transparencyProtocol: "Transparency Protocol",
                transparencyDesc: "We provide complete diagnostic transparency. Every issue found during inspection is documented below.",
                diagnosticLog: "Diagnostic Log",
                noFaultsLogged: "No Faults Logged",
                location: "Location",
                allSet: "YOU'RE ALL SET",
                advisorMsg: "Our advisor Divine will call you shortly about the",
                callUsNow: "Call Us Now",
                backToInventory: "Back to Inventory",
                fullscreen: "Fullscreen",
                aiAgent: "AI Agent Available"
            },
            rental: {
                badge: "AVAILABLE FOR RENT",
                ratesLabel: "Rental Rates",
                inquireRates: "Call for Rates",
                tabLabel: "Rent",
                formSubtitle: "Interested in renting this vehicle? Submit your info and our team will call you to discuss rental terms, availability, and requirements.",
                successTitle: "INQUIRY RECEIVED",
                successMsg: "Our team will call you shortly to discuss rental details for this",
                disclaimer: "Rentals require a valid driver's license, proof of insurance, and a security deposit. Rates are subject to availability.",
                submitButton: "Send Rental Inquiry"
            },
            sortOptions: {
                priceHighLow: "Price: High-Low",
                priceLowHigh: "Price: Low-High",
                yearNewest: "Year: Newest",
                yearOldest: "Year: Oldest",
                mileageLowHigh: "Mileage: Low-High",
                allMakes: "All Makes"
            },
            formErrors: {
                invalidPhone: "Please enter a valid 10-digit phone number",
                nameRequired: "Please enter your name",
                genericError: "Something went wrong. Please call us directly at (832) 400-9760"
            }
        },
        vehicleDetail: {
            // Verified badge
            verifiedBadge: "Triple J Verified",
            verifiedTooltip: "This vehicle has been inspected and verified by Triple J Auto Investment.",
            // Price block
            tripleJPrice: "Triple J Price",
            marketAverage: "Market Average",
            youSave: "You Save",
            estMonthly: "Est. Monthly",
            priceDisclaimer: "Est. ${amount}/mo with $500 down. 24 months. Subject to approval. See dealer for details.",
            marketEstimateNote: "Estimated Market Value",
            // Vehicle story
            vehicleStoryHeading: "Vehicle Story",
            fallbackStory: "Contact us for more details about this vehicle.",
            // Condition
            conditionHeading: "Condition Report",
            // Specs
            specsHeading: "Vehicle Specifications",
            specYear: "Year",
            specMake: "Make",
            specModel: "Model",
            specMileage: "Mileage",
            specVin: "VIN",
            specStatus: "Status",
            specBodyType: "Body Type",
            specConditionNotes: "Condition Notes",
            // Social proof
            listedToday: "Listed today",
            listedYesterday: "Listed yesterday",
            listedDaysAgo: "Listed {days} days ago",
            // CTAs (references: home.hero.scheduleVisit, common.callAgent, finance.applyNow)
            scheduleVisit: "Schedule a Visit",
            callUs: "Call Us",
            applyForFinancing: "Apply for Financing",
            // Navigation
            backToInventory: "Back to Inventory",
            // Share
            share: "Share",
            // Photo gallery
            photoCount: "{current} of {total}",
            noPhotos: "No photos available",
            // SEO
            seoDescription: "{year} {make} {model} - {mileage} miles. ${price}. In-house financing available. Houston, TX.",
            // Inventory card link
            viewDetails: "View Details"
        },
        // Phase 15: Engagement Spectrum
        engagement: {
            // Level 0 - Save/Favorite
            save: "Save",
            saved: "Saved",
            unsave: "Remove from Saved",
            savedVehicles: "Saved Vehicles",
            noSavedVehicles: "No saved vehicles yet",
            tapToSave: "Tap the heart to save vehicles you like",
            viewAllInventory: "View All Inventory",
            // Level 0 - Payment Calculator
            paymentCalculator: "Payment Calculator",
            downPayment: "Down Payment",
            loanTerm: "Loan Term",
            months: "months",
            estimatedMonthly: "Estimated Monthly",
            paymentDisclaimer: "Estimate only. Subject to credit approval. See dealer for details.",
            withDown: "with {amount} down",
            // Level 1 - Phone-only actions
            enterPhone: "Enter your phone number",
            phoneNumber: "Phone Number",
            invalidPhone: "Please enter a valid phone number",
            getPriceAlert: "Get Price Alert",
            priceAlertDesc: "We'll text you if the price drops",
            similarVehicles: "Similar Vehicles",
            similarDesc: "We'll text you matches from our inventory",
            vehicleReport: "Vehicle Report",
            reportDesc: "Get the full inspection details",
            submitted: "Submitted!",
            wellBeInTouch: "We'll be in touch soon",
            // Level 2 - Name + Phone actions
            yourName: "Your Name",
            scheduleVisit: "Schedule a Visit",
            scheduleDesc: "Come see this vehicle in person",
            preferredTime: "Preferred Time",
            morning: "Morning",
            afternoon: "Afternoon",
            anytime: "Anytime",
            askQuestion: "Ask a Question",
            askDesc: "We'll respond within the hour",
            yourQuestion: "Your Question",
            questionPlaceholder: "What would you like to know about this vehicle?",
            visitConfirmed: "Visit Request Sent!",
            visitConfirmedDesc: "We'll call you to confirm a time",
            questionReceived: "Question Received!",
            questionReceivedDesc: "We'll respond within the hour",
            // Level 3 - Reserve
            reserveVehicle: "Reserve This Vehicle",
            reserveDesc: "Declare your serious interest -- we'll hold it for you",
            reserveNote: "No deposit required. We'll call you within the hour to discuss next steps.",
            reserved: "Reservation Submitted!",
            reservedDesc: "We'll hold this vehicle and call you shortly",
            reserveNow: "Reserve Now",
            // General
            submit: "Submit",
            sending: "Sending...",
            cancel: "Cancel",
            callUs: "Call Us",
            orCallDirectly: "Or call us directly",
            nameRequired: "Name is required",
            somethingWrong: "Something went wrong. Please try again.",
        },
        contact: {
            title: "CONTACT US",
            subtitle: "Get in Touch",
            desc: "Send us a message. We respond within the hour during business hours.",
            form: {
                name: "Full Name",
                phone: "Phone Number",
                email: "Email Address",
                message: "Message",
                submit: "Send Message",
                submitting: "SENDING...",
                sent: "MESSAGE SENT",
                sentDesc: "We've received your message. Expect to hear from us within 60 minutes during business hours.",
                reset: "Send Another Message",
                placeholders: {
                    name: "Your Name",
                    phone: "(XXX) XXX-XXXX",
                    email: "your@email.com",
                    message: "How can we help you?"
                }
            },
            info: {
                hq: "OUR LOCATION",
                location: "Visit Us",
                openNav: "Get Directions",
                directLine: "CALL US",
                voice: "Phone",
                hours: "BUSINESS HOURS",
                window: "Response Time",
                weekdays: "Mon - Sat",
                saturday: "Saturday",
                sunday: "Sunday",
                closed: "CLOSED"
            }
        },
        login: {
            title: "ADMIN LOGIN",
            subtitle: "Dealer Portal",
            emailLabel: "Email",
            emailPlaceholder: "Enter your email",
            passwordLabel: "Password",
            passwordPlaceholder: "Enter your password",
            authenticate: "Log In",
            forgotAccess: "Forgot Password?",
            errorTitle: "Login Failed",
            errorMessage: "Invalid email or password. Please try again.",
            recoveryTitle: "Password Reset Sent",
            recoveryMessage: "Check your email for a link to reset your password.",
            secureNote: "Secure connection. Authorized personnel only."
        },
        faq: {
            badge: "Help Center",
            title: "FAQ",
            subtitle: "Frequently asked questions. If your question isn't answered here, contact us directly.",
            searchPlaceholder: "Search questions...",
            noResults: "No results found for",
            stillHaveQuestions: "STILL HAVE QUESTIONS?",
            contactPrompt: "Contact us directly. We respond within the hour during business hours.",
            contactCta: "CONTACT US",
            questions: [
                {
                    q: "What types of vehicles do you sell?",
                    a: "Triple J Auto Investment sells reliable pre-owned sedans, SUVs, and trucks priced from $3,000 to $8,000. Every vehicle on our lot is inspected before listing. We focus on dependable, everyday vehicles for Houston families -- not luxury cars, but honest transportation you can count on."
                },
                {
                    q: "Can I buy a car with bad credit in Houston?",
                    a: "Yes, you can buy a car with bad credit at Triple J Auto Investment in Houston. We offer financing options for buyers with all credit situations, including low scores and no credit history. Visit us at 8774 Almeda Genoa Road or call (832) 400-9760 to discuss your options -- we work with your budget, not against it."
                },
                {
                    q: "What is Buy Here Pay Here financing?",
                    a: "Buy Here Pay Here means the dealership finances your vehicle directly -- no bank involved, no waiting for approval. At Triple J Auto Investment, we handle the entire process in-house. You choose your vehicle, bring your documents, make a down payment, and drive home the same day. Payments are made directly to Triple J, making it simple and straightforward."
                },
                {
                    q: "How much is a down payment at Triple J Auto Investment?",
                    a: "Down payments at Triple J Auto Investment start at $1,000. The exact amount depends on the vehicle you choose and your budget. We work with you to find a down payment that makes sense so you can drive away without breaking the bank. Call (832) 400-9760 to discuss your specific situation."
                },
                {
                    q: "Do I need a credit check to buy a car at Triple J?",
                    a: "No, Triple J Auto Investment does not require a traditional credit check for in-house financing. We focus on your ability to make payments, not your credit score. Bring a valid ID, proof of income, and proof of residence -- that is all you need to get started."
                },
                {
                    q: "What documents do I need to buy a car?",
                    a: "To buy a car at Triple J Auto Investment, you need three documents: a valid driver's license or government-issued ID, proof of income (pay stubs or bank statements), and proof of residence (utility bill or lease agreement). Insurance coverage confirmation is also required before you drive off the lot."
                },
                {
                    q: "How does in-house financing work?",
                    a: "In-house financing at Triple J Auto Investment means we finance your vehicle directly -- no third-party bank or lender involved. You choose a vehicle from our lot, provide your documents, make a down payment starting at $1,000, and drive home the same day. You make weekly or bi-weekly payments directly to Triple J. No credit check required."
                },
                {
                    q: "What cars can I get for under $5,000 in Houston?",
                    a: "Triple J Auto Investment regularly stocks reliable used cars under $5,000 in Houston. Our inventory includes sedans like Honda Accords, Toyota Camrys, and Ford Fusions -- all inspected and ready to drive. Visit our lot at 8774 Almeda Genoa Road or browse our website to see current availability."
                },
                {
                    q: "What is the cheapest car at Triple J Auto Investment?",
                    a: "Triple J Auto Investment carries pre-owned vehicles starting around $3,000. Our inventory changes regularly, so the most affordable options vary. All vehicles are inspected before listing regardless of price. Check our inventory page or call (832) 400-9760 for the latest available vehicles at the lowest prices."
                },
                {
                    q: "Do you have SUVs or trucks under $8,000?",
                    a: "Yes, Triple J Auto Investment carries SUVs and trucks priced under $8,000. Our inventory includes popular models like the Chevy Equinox, Ford Explorer, and Toyota 4Runner when available. Every vehicle is inspected before being listed. Browse our inventory online or visit us at 8774 Almeda Genoa Road in Houston."
                },
                {
                    q: "How much does it cost to rent a car in Houston?",
                    a: "Triple J Auto Investment offers affordable vehicle rentals in Houston by the week or month -- no long-term contracts required. Rates depend on the vehicle and rental period. Call (832) 400-9760 for current rental rates and availability. We are located at 8774 Almeda Genoa Road, Houston, TX 77075."
                },
                {
                    q: "Can I rent a car without a credit card in Houston?",
                    a: "Yes, Triple J Auto Investment offers vehicle rentals in Houston without requiring a credit card. You will need a valid driver's license, proof of insurance, and a security deposit. Contact us at (832) 400-9760 to discuss rental requirements and reserve a vehicle."
                },
                {
                    q: "Do you offer weekly or monthly car rentals?",
                    a: "Yes, Triple J Auto Investment offers both weekly and monthly vehicle rentals in Houston. No long-term contracts are required -- rent for as long as you need. A valid driver's license, proof of insurance, and a security deposit are required. Call (832) 400-9760 for rates and availability."
                },
                {
                    q: "Is Triple J Auto Investment a licensed dealer?",
                    a: "Yes, Triple J Auto Investment is a fully licensed Texas auto dealer. Our Texas Dealer License number is P171632. We operate from our permanent lot at 8774 Almeda Genoa Road, Houston, TX 77075, and comply with all Texas Department of Motor Vehicles regulations."
                },
                {
                    q: "How do I know a used car is reliable?",
                    a: "Every vehicle at Triple J Auto Investment is inspected before being listed for sale. We provide vehicle history information and full condition transparency -- any issues found during inspection are documented and disclosed. You can also use our free VIN lookup tool to check a vehicle's history, or arrange your own independent inspection before buying."
                },
                {
                    q: "What happens after I buy a car from Triple J?",
                    a: "After you purchase a vehicle from Triple J Auto Investment, we submit all required title and registration paperwork to the Texas DMV within 48 hours. You receive temporary tags valid for 60 days while the state processes your permanent plates. You are responsible for obtaining insurance before driving off the lot."
                },
                {
                    q: "Do you offer financing?",
                    a: "Yes, Triple J Auto Investment offers in-house financing with no credit check required. Down payments start at $1,000, and payments are made directly to Triple J. We also work with third-party lenders for buyers who prefer traditional financing. Call (832) 400-9760 to discuss options."
                },
                {
                    q: "Do you rent vehicles?",
                    a: "Yes, Triple J Auto Investment offers affordable vehicle rentals in Houston by the week or month. No long-term contracts required. You need a valid driver's license, proof of insurance, and a security deposit. Call (832) 400-9760 for current rates and availability."
                },
                {
                    q: "Where are you located?",
                    a: "Triple J Auto Investment is located at 8774 Almeda Genoa Road, Houston, Texas 77075. We serve families across Houston, South Houston, Pasadena, Pearland, and surrounding areas. Open Monday through Saturday, 9:00 AM to 6:00 PM."
                },
                {
                    q: "What are your business hours?",
                    a: "Triple J Auto Investment is open Monday through Saturday, 9:00 AM to 6:00 PM. We are closed on Sundays. Call (832) 400-9760 during business hours or visit us at 8774 Almeda Genoa Road, Houston, TX 77075."
                },
                {
                    q: "Do you speak Spanish?",
                    a: "Yes, Triple J Auto Investment is fully bilingual. Our team speaks both English and Spanish to serve the Houston community. Hablamos espanol -- visitenos en 8774 Almeda Genoa Road o llamenos al (832) 400-9760."
                },
                {
                    q: "Can I trade in my current vehicle?",
                    a: "Yes, Triple J Auto Investment accepts trade-ins. Bring your vehicle to our lot at 8774 Almeda Genoa Road for a fair assessment, and we will apply the value toward your next purchase. Call (832) 400-9760 to schedule an evaluation."
                },
                {
                    q: "Are your vehicles inspected?",
                    a: "Yes, every vehicle at Triple J Auto Investment goes through an inspection process before being listed for sale. We document any issues found and provide full condition transparency so you can buy with confidence."
                }
            ]
        },
        services: {
            badge: "What We Do",
            title: "SERVICES",
            subtitle: "Everything you need to get on the road with confidence.",
            learnMore: "Learn More",
            list: [
                {
                    title: "Vehicle Sales",
                    desc: "Triple J Auto Investment sells reliable pre-owned vehicles in the $3,000-$8,000 range to Houston families. Every vehicle is inspected before listing.",
                    detail: "Browse our lot at 8774 Almeda Genoa Road or our website to find sedans, SUVs, and trucks that fit your needs and budget. We carry popular models like Honda Accord, Toyota Camry, Chevy Equinox, and Ford Explorer. Transparent pricing on every vehicle -- no hidden fees, no surprises."
                },
                {
                    title: "Vehicle Rentals",
                    desc: "Triple J Auto Investment offers affordable vehicle rentals in Houston by the week or month. No long-term contracts required.",
                    detail: "Whether you need a vehicle for a week or a month, our rental fleet has you covered. A valid driver's license, proof of insurance, and a security deposit are required. Call (832) 400-9760 for current rates and availability."
                },
                {
                    title: "VIN History Reports",
                    desc: "Triple J Auto Investment provides free VIN lookup so you know exactly what you are buying before you commit.",
                    detail: "We provide transparent vehicle history information including accident reports, title status, and service records when available. Use our online VIN lookup tool or ask our team for a full vehicle history report."
                },
                {
                    title: "In-House Financing",
                    desc: "Triple J Auto Investment provides in-house Buy Here Pay Here financing with no credit check. Down payments start at $1,000.",
                    detail: "We finance your vehicle directly -- no bank, no third-party lender, no waiting. Bring your ID, proof of income, and proof of residence. Make your down payment and drive home the same day. We also work with third-party lenders for buyers who prefer traditional financing."
                },
                {
                    title: "Trade-In Assessment",
                    desc: "Triple J Auto Investment accepts trade-ins and applies the value directly toward your next vehicle purchase.",
                    detail: "Bring your vehicle to our lot at 8774 Almeda Genoa Road for a fair assessment. We'll evaluate your trade-in and apply the value to your purchase. Call (832) 400-9760 to schedule an evaluation."
                }
            ],
            dontDo: {
                title: "WHAT WE DON'T DO",
                items: [
                    { title: "No Warranties or Guarantees", desc: "All sales are AS-IS. We do not provide warranties, implied or express. You purchase based on disclosed condition." },
                    { title: "No Post-Sale Modifications", desc: "We do not perform mechanical work, detailing, or customization after purchase. Vehicles are delivered as inspected." },
                    { title: "No Returns or Refunds", desc: "All sales are final. Inspect thoroughly before commitment. We are happy to answer questions before you buy." },
                    { title: "No Pressure", desc: "We believe in honest conversations, not sales tactics. Take your time, ask questions, and decide when you are ready." }
                ]
            }
        },
        about: {
            hero: {
                badge: "Our Story",
                title: "TRIPLE J AUTO INVESTMENT",
                subtitle: "Your trusted automotive partner in Houston."
            },
            story: {
                title: "Who We Are",
                p1: "Triple J Auto Investment is a family-run independent dealership in Houston, Texas. We specialize in quality pre-owned vehicles that real families can afford -- reliable cars in the $3,000 to $8,000 range that get you where you need to go.",
                p2: "Located at 8774 Almeda Genoa Road, we serve the Houston community with both vehicle sales and rentals. We believe buying a car should be simple, honest, and even enjoyable. No pressure, no games -- just straightforward service from people who care.",
                p3: "We're fully bilingual, serving our community in both English and Spanish. Whether you're buying your first car, upgrading for your growing family, or need a rental to get through the week, we're here to help."
            },
            values: {
                title: "What We Stand For",
                v1Title: "Honesty",
                v1Desc: "Transparent pricing, honest vehicle histories, and straightforward conversations. What you see is what you get.",
                v2Title: "Family First",
                v2Desc: "We treat every customer like family. Your trust matters more to us than any single sale.",
                v3Title: "Community",
                v3Desc: "We're proud to be part of the Houston community. We're your neighbors, and we're here for the long run."
            },
            location: {
                title: "Visit Us",
                address: "8774 Almeda Genoa Road",
                city: "Houston, Texas 77075",
                phone: "(832) 400-9760",
                hours: "Monday - Saturday: 9:00 AM - 6:00 PM",
                closed: "Sunday: Closed",
                directions: "Get Directions"
            },
            cta: {
                title: "Ready to Find Your Next Vehicle?",
                desc: "Visit our lot or browse our inventory online. We're here to help you find the right car at the right price.",
                button: "Browse Inventory"
            }
        },
        finance: {
            badge: "Financing",
            title: "FINANCING OPTIONS",
            subtitle: "Flexible payment plans to fit your budget.",
            intro: "Triple J Auto Investment offers in-house Buy Here Pay Here financing with no credit check required. Down payments start at $1,000, and you can drive home the same day. We also work with third-party lenders for traditional financing options. Buying a car is a big decision -- we make financing simple so Houston families can get reliable transportation without the hassle.",
            bhph: {
                processTitle: "How Buy Here Pay Here Works at Triple J",
                processIntro: "Buy Here Pay Here means Triple J Auto Investment finances your vehicle directly -- no bank, no credit check, no waiting for approval. You deal with us from start to finish.",
                processSteps: [
                    { title: "Choose Your Vehicle", desc: "Browse our inventory of inspected pre-owned vehicles priced from $3,000 to $8,000." },
                    { title: "Bring Your Documents", desc: "Valid ID, proof of income, and proof of residence. That is all you need." },
                    { title: "Make Your Down Payment", desc: "Down payments start at $1,000. We work with your budget to find the right amount." },
                    { title: "Drive Home Today", desc: "Once approved, you drive your vehicle home the same day. Payments are made directly to Triple J." }
                ],
                whyTitle: "Why Choose Buy Here Pay Here?",
                whyItems: [
                    "No credit check required",
                    "No bank approval needed",
                    "Same-day drive-off",
                    "Payments made directly to Triple J",
                    "We work with all credit situations"
                ]
            },
            options: {
                title: "How It Works",
                step1Title: "Choose Your Vehicle",
                step1Desc: "Browse our inventory of inspected pre-owned vehicles priced from $3,000 to $8,000.",
                step2Title: "Bring Your Documents",
                step2Desc: "Valid ID, proof of income, and proof of residence. No credit check required for in-house financing.",
                step3Title: "Drive Home Today",
                step3Desc: "Make your down payment (starting at $1,000) and drive home the same day."
            },
            cta: {
                title: "Ready to Get Started?",
                desc: "Contact us to discuss financing options for any vehicle on our lot. No credit check required for in-house financing.",
                button: "Contact Us",
                phone: "Or call us at (832) 400-9760"
            },
            form: {
                downPayment: "Down Payment",
                creditProfile: "Credit Profile",
                creditExcellent: "Excellent (750+)",
                creditGood: "Good (700-749)",
                creditFair: "Fair (650-699)",
                creditPoor: "Below 650",
                vehiclePlaceholder: "e.g., 2018 Honda Civic",
                softInquiryNotice: "By submitting, you authorize a soft credit inquiry which does not impact your credit score."
            },
            requirements: {
                title: "Requirements",
                items: [
                    "Valid driver's license or government-issued ID",
                    "Proof of income (pay stubs or bank statements)",
                    "Proof of residence (utility bill or lease agreement)",
                    "Insurance coverage confirmation"
                ]
            },
            rates: {
                title: "Estimated Rates",
                excellent: { label: "Excellent Credit", rate: "4.9% - 6.9%", detail: "750+ score, 20%+ down" },
                good: { label: "Good Credit", rate: "7.9% - 10.9%", detail: "700-749 score, 15%+ down" },
                fair: { label: "Fair Credit", rate: "11.9% - 16.9%", detail: "650-699 score, 25%+ down required" },
                disclaimer: "*Rates subject to change. Final APR determined by lender based on full credit profile."
            },
            importantNotice: {
                title: "Important Notice",
                content: "Financing is subject to approval by third-party lenders. Triple J Auto Investment does not provide direct financing. We are a dealership, not a bank."
            }
        },
        policies: {
            title: "POLICIES",
            subtitle: "Our commitment to transparency.",
            privacy: {
                title: "Privacy Policy",
                content: "Triple J Auto Investment is committed to protecting your privacy. We collect only the information necessary to serve you and never sell your personal data to third parties. Any information you provide -- including your name, phone number, and email -- is used solely to assist you with vehicle inquiries, financing, and service communications."
            },
            terms: {
                title: "Terms of Service",
                content: "All vehicles are sold AS-IS unless otherwise stated in writing. Prices listed on our website are subject to change without notice. Vehicle availability is not guaranteed until a purchase agreement is signed. By using this website, you agree to these terms."
            },
            returns: {
                title: "Return Policy",
                content: "All sales are final. We encourage all buyers to thoroughly inspect vehicles and review all documentation before completing a purchase. We are happy to answer any questions before you buy."
            },
            asIs: {
                title: "AS-IS Sales Policy",
                noWarranties: "No Warranties",
                noReturns: "No Returns",
                mainWarning: "ALL VEHICLES ARE SOLD \"AS-IS\" WITH NO WARRANTIES, EXPRESSED OR IMPLIED.",
                p1: "This means you are purchasing the vehicle in its current condition, with all existing faults, whether known or unknown.",
                p2: "Triple J Auto Investment makes no guarantees regarding the mechanical, electrical, cosmetic, or operational condition of any vehicle. While we provide diagnostic disclosures where available, we do not warrant that such disclosures are exhaustive or complete.",
                acknowledge: "By completing a purchase, you acknowledge that:",
                items: [
                    "You have inspected the vehicle or waived your right to do so",
                    "All post-sale repairs are your sole responsibility",
                    "No refunds, exchanges, or returns are permitted",
                    "You accept all risk of future malfunction or failure"
                ]
            },
            payment: {
                title: "Payment Policy",
                acceptedMethods: "Accepted Methods",
                methodsTitle: "Accepted Payment Methods",
                methods: [
                    { method: "Cash:", detail: "Immediate release of vehicle" },
                    { method: "Cashier's Check:", detail: "Verified same-day release" },
                    { method: "Debit Card:", detail: "Accepted for deposits and payments" },
                    { method: "Personal Check:", detail: "3-5 business day hold for clearance" },
                    { method: "Approved Financing:", detail: "Release upon lender funding confirmation" }
                ],
                deposit: {
                    title: "Deposit Policy",
                    content: "Non-refundable deposits may be required to hold a vehicle. Deposits are applied to final purchase price. If buyer fails to complete purchase within agreed timeframe, deposit is forfeited."
                }
            },
            titleRegistration: {
                title: "Title & Registration Policy",
                compliance: "Texas DMV Compliance",
                introBefore: "We submit all required paperwork to the Texas DMV within",
                introHighlight: "48 hours",
                introAfter: "of completed sale. Processing time is controlled by the state, not Triple J Auto Investment.",
                buyerTitle: "Buyer Responsibilities",
                buyerItems: [
                    "Obtain valid insurance coverage before taking possession",
                    "Complete emissions testing if required by county",
                    "Pay all applicable state and local taxes, title fees, and registration fees",
                    "Provide valid government-issued ID and proof of residence"
                ],
                outOfStateLabel: "Out-of-State Buyers:",
                outOfState: "You are responsible for understanding and complying with your state's registration requirements. We provide all necessary documentation but do not guarantee acceptance by your state's DMV."
            },
            inspection: {
                title: "Inspection & Test Drive Policy",
                prePurchaseTitle: "Pre-Purchase Inspections",
                prePurchaseContent: "Buyers may arrange independent mechanical inspections at their own expense. Inspector must be licensed and insured. Inspections must be scheduled in advance and completed on our premises during business hours.",
                testDriveTitle: "Test Drives",
                testDriveItems: [
                    "Valid driver's license required",
                    "Proof of insurance may be required",
                    "Routes are predetermined by Triple J staff",
                    "Driver assumes all liability during test drive"
                ]
            },
            privacyConsent: "By providing your information, you consent to communication via phone, email, or SMS regarding your inquiry or purchase."
        },
        legal: {
            title: "LEGAL",
            subtitle: "Legal information and disclosures.",
            dealerInfo: {
                title: "Dealer Information",
                name: "Triple J Auto Investment",
                license: "Texas Dealer License: P171632",
                address: "8774 Almeda Genoa Road, Houston, Texas 77075"
            },
            disclaimer: {
                title: "Disclaimer",
                content: "All vehicles are sold AS-IS. Prices and availability are subject to change. Photos may not represent the exact vehicle. Contact us for the most current information."
            },
            backToHome: "Back to Home"
        },
        notFound: {
            title: "PAGE NOT FOUND",
            subtitle: "The page you're looking for doesn't exist or has been moved.",
            homeButton: "Go to Homepage",
            contactButton: "Contact Us"
        },
        vinLookup: {
            badge: "Vehicle History",
            title: "VIN LOOKUP",
            subtitle: "Enter a VIN to check the vehicle's history and details.",
            placeholder: "Enter 17-digit VIN",
            search: "Look Up VIN",
            searching: "Searching...",
            results: "Vehicle Details",
            noResults: "No information found for this VIN. Please double-check the number and try again.",
            logs: {
                connecting: "Connecting to vehicle database...",
                accessGranted: "Connection established.",
                decoding: "Looking up VIN:",
                extracting: "Vehicle data retrieved.",
                populating: "Organizing results...",
                rendering: "Preparing report...",
                processing: "Loading...",
                initializing: "Ready",
                connectionFailed: "Connection failed. Please try again.",
                dataError: "Data error:"
            },
            fields: {
                make: "Make",
                model: "Model",
                year: "Year",
                waitingForInput: "Waiting for input...",
                dataStream: "Status Log",
                quickDecode: "Quick Lookup"
            },
            resultLabels: {
                manufacturer: "Manufacturer (Make)",
                model: "Model",
                year: "Year",
                bodyType: "Body Type",
                detailedConfig: "Detailed Configuration",
                trimLevel: "Trim Level",
                series: "Series",
                transmission: "Transmission",
                doors: "Doors",
                engineSpecs: "Engine & Performance",
                cylinders: "Cylinders",
                horsepower: "Horsepower",
                drivetrain: "Drivetrain",
                fuelSystem: "Fuel System",
                standardCombustion: "Standard Combustion",
                manufacturingOrigin: "Manufacturing Origin",
                plant: "Plant",
                mfgEntity: "Manufacturer",
                verified: "Verified"
            },
            vinLabel: "Vehicle Identification Number",
            decode: "DECODE",
            decodeAnother: "Decode Another VIN",
            baseTrim: "Base",
            doorSuffix: "Door",
            errors: {
                lettersOnly: "Only letters and numbers are allowed",
                forbiddenChar: "is not allowed in VINs (I, O, Q are prohibited)",
                exactLength: "VIN must be exactly 17 characters",
                currently: "currently",
                noData: "No vehicle data found for this VIN. Please check the number and try again."
            }
        },
        paymentOptions: {
            badge: "Payments",
            title: "PAYMENT OPTIONS",
            subtitle: "Flexible ways to pay for your vehicle.",
            methods: {
                title: "Accepted Payment Methods",
                cash: "Cash",
                cashDesc: "Pay in full at our dealership.",
                financing: "Financing",
                financingDesc: "Monthly payment plans available. Talk to our team about options.",
                debit: "Debit Card",
                debitDesc: "Accepted for deposits and payments.",
                cashiers: "Cashier's Check",
                cashiersDesc: "Accepted for full vehicle purchases."
            },
            note: "For questions about payment options, call us at (832) 400-9760.",
            fraud: {
                title: "Fraud Prevention",
                content: "Triple J Auto Investment will never ask for payment via wire transfer, gift cards, or cryptocurrency. If you receive a suspicious request claiming to be from us, please call (832) 400-9760 to verify."
            },
            cashAdvantages: {
                title: "Advantages",
                items: [
                    "Same-day pickup",
                    "No financing fees or interest",
                    "Strongest negotiating position",
                    "No credit check required"
                ],
                irsNote: "Transactions over $10,000 require IRS Form 8300 reporting."
            },
            cashiersRequirements: {
                title: "Requirements",
                items: [
                    "Must be from a US-based bank",
                    "Made payable to \"Triple J Auto Investment\"",
                    "Subject to bank verification call",
                    "Bring valid government-issued ID"
                ]
            },
            debitDetails: {
                title: "Details",
                items: [
                    "Accepted for deposits and partial payments",
                    "Daily limits may apply per your bank",
                    "PIN or signature authorization"
                ]
            },
            financingRequirements: {
                title: "Requirements",
                items: [
                    "Credit score 580+ (minimum)",
                    "Proof of income and residence",
                    "Valid insurance coverage",
                    "Down payment 10-25% (score dependent)"
                ]
            },
            personalCheck: {
                title: "Personal Checks Accepted with Hold",
                before: "We accept personal checks, but vehicle release is delayed",
                holdPeriod: "3-5 business days",
                after: "for bank clearance. If immediate pickup is required, use cash, cashier's check, or debit card instead."
            }
        },
        polish: {
            // Offline
            offlineBanner: "You appear to be offline. Some features may be unavailable.",

            // Connection error
            connectionError: "Having trouble connecting. Some features may be unavailable.",
            connectionRetry: "Retry",
            connectionCallUs: "Call us at (832) 400-9760",

            // Loading states
            loadingInventory: "Loading inventory...",
            loadingPage: "Loading...",
            loadingSubmitting: "Submitting...",
            loadingSending: "Sending...",

            // Empty states
            emptyInventory: "No vehicles currently listed. Check back soon!",
            emptyInventorySubtext: "We regularly add new vehicles to our inventory.",
            emptyDashboard: "No registrations found.",
            emptyDashboardSubtext: "When you purchase a vehicle, your registration details will appear here.",

            // Error states
            errorGeneric: "Something went wrong. Please try again.",
            errorFormSubmit: "We couldn't submit your information. Please try again or call us.",
            errorLoadFailed: "Failed to load. Please check your connection and try again.",
            errorReload: "Reload Page",
            errorTryAgain: "Try Again",
            errorCallUs: "Or call us",

            // Accessibility
            skipToContent: "Skip to main content",
            closeModal: "Close",
            previousImage: "Previous image",
            nextImage: "Next image",
            openMenu: "Open menu",
            closeMenu: "Close menu",
            switchLanguage: "Switch language"
        }
    },
    es: {
        nav: {
            home: "Inicio",
            inventory: "Inventario",
            services: "Servicios",
            about: "Nosotros",
            contact: "Contacto",
            financing: "Financiamiento",
            login: "Entrar",
            admin: "Admin"
        },
        footer: {
            tagline: "Vehiculos usados de confianza para familias de Houston.",
            quickLinks: "Enlaces Rapidos",
            contact: "Contactenos",
            legal: "Legal",
            privacy: "Politica de Privacidad",
            terms: "Terminos de Servicio",
            rights: "Todos los derechos reservados.",
            location: "Nuestra Ubicacion",
            address: "8774 Almeda Genoa Road",
            city: "Houston, Texas 77075",
            phone: "(832) 400-9760",
            phoneLabel: "Llamenos",
            hours: "Horario",
            hoursDetail: "Lun-Sab 9AM-6PM",
            closed: "Cerrado Domingo",
            dealerLicense: "Licencia de Distribuidor",
            followUs: "Siguenos",
            copyright: "Triple J Auto Investment"
        },
        common: {
            callAgent: "Llamenos",
            viewAll: "Ver Todos",
            loading: "Cargando...",
            price: "Precio",
            mileage: "Millas",
            year: "Ano",
            status: "Estado",
            available: "Disponible",
            sold: "Vendido",
            pending: "Pendiente",
            asIs: "(TAL CUAL)",
            expressInterest: "Me Interesa",
            phone: "(832) 400-9760",
            backToHome: "Volver al Inicio",
            contactUs: "Contactenos",
            learnMore: "Mas Informacion",
            getDirections: "Como Llegar",
            sendMessage: "Enviar Mensaje",
            viewInventory: "Ver Inventario",
            forRent: "En Renta",
            forSale: "En Venta",
            saleAndRental: "Venta y Renta",
            perDay: "/dia",
            perWeek: "/semana",
            bookNow: "Reservar",
            rentalRates: "Tarifas de Renta",
            dailyRate: "Tarifa Diaria",
            weeklyRate: "Tarifa Semanal",
            allListings: "Todos",
            listingType: "Tipo"
        },
        home: {
            hero: {
                heading: "TRIPLE J AUTO INVESTMENT",
                subheading: "FIRMA DE INVERSION AUTOMOTRIZ",
                tagline: "Vehiculos usados confiables para familias de Houston. Precios transparentes, financiamiento interno, sin sorpresas.",
                scheduleVisit: "Agendar Visita",
                callNow: "Llamar Ahora",
                scrollPrompt: "Explorar"
            },
            authority: {
                title: "LA CONFIANZA DE LAS FAMILIAS DE HOUSTON",
                familiesServed: "Familias Atendidas",
                fiveStarReviews: "Resenas de 5 Estrellas",
                yearsInBusiness: "Anos Sirviendo a Houston",
                vehiclesDelivered: "Vehiculos Entregados"
            },
            seHabla: "Se Habla Espanol",
            ticker: [
                "AL SERVICIO DE FAMILIAS DE HOUSTON",
                "PRECIOS TRANSPARENTES",
                "HABLAMOS ESPANOL",
                "VEHICULOS USADOS $3K-$8K",
                "VENTAS Y RENTAS"
            ],
            arsenal: {
                title: "Nuestro Inventario",
                subtitle: "Vehiculos Destacados",
                desc: "Explore nuestra seleccion de vehiculos usados confiables.",
                viewAll: "Ver Inventario Completo"
            },
            pillars: {
                title: "Por Que Triple J",
                subtitle: "Nuestra Promesa",
                p1Title: "CONFIANZA",
                p1Desc: "Cada vehiculo es inspeccionado y verificado antes de llegar a nuestro lote. Respaldamos lo que vendemos.",
                p1Highlight: "Tu confianza nos importa.",
                p2Title: "SENCILLEZ",
                p2Desc: "Sin complicaciones, sin cargos ocultos. Nuestro proceso de compra es rapido y directo.",
                p2Highlight: "Facil de principio a fin.",
                p3Title: "VALOR",
                p3Desc: "Vehiculos de calidad a precios honestos. Cada carro es seleccionado por su confiabilidad y precio justo.",
                p3Highlight: "Valor real, ahorro real."
            },
            cards: {
                vetting: {
                    title: "Historial del Vehiculo",
                    desc: "Cada vehiculo viene con un reporte de historial completo. Sepa exactamente lo que esta comprando.",
                    cta: "Buscar VIN"
                },
                psych: {
                    title: "Nuestra Historia",
                    desc: "Un concesionario familiar basado en la confianza. Tratamos a cada cliente como nos gustaria ser tratados.",
                    cta: "Sobre Nosotros"
                },
                velocity: {
                    title: "Rapido y Sencillo",
                    desc: "Desde ver hasta manejar -- nuestro proceso simplificado lo pone en el camino rapida y confiadamente.",
                    cta: "Listos para Usted"
                }
            },
            vault: {
                access: "Listo para Encontrar Su Carro?",
                title: "VER TODO",
                enter: "Ver Inventario"
            },
            signals: {
                label: "Lo Que Ofrecemos",
                items: [
                    "ABIERTO LUN-SAB 9AM-6PM",
                    "AL SERVICIO DE FAMILIAS DE HOUSTON",
                    "PRECIOS TRANSPARENTES EN CADA VEHICULO",
                    "VEHICULOS USADOS $3K-$8K",
                    "VENTAS Y RENTAS DE VEHICULOS",
                    "HABLAMOS ESPANOL",
                    "FINANCIAMIENTO DISPONIBLE"
                ]
            },
            architecture: "Lo Que Nos Diferencia"
        },
        inventory: {
            title: "Nuestros Vehiculos",
            subtext: "Vehiculos Disponibles",
            sort: "Orden",
            filter: "Filtro de Estado",
            searchPlaceholder: "Buscar por Marca/Modelo...",
            noResults: "Cargando vehiculos...",
            modal: {
                tabs: {
                    overview: "Resumen",
                    specs: "Reporte y Detalles",
                    transparency: "Condicion",
                    purchase: "Consultar"
                },
                submit: "Enviar Consulta",
                submitting: "Enviando...",
                successTitle: "Mensaje Enviado",
                successMsg: "Nuestro equipo ha recibido su consulta. Nos comunicaremos pronto con mas detalles.",
                disclaimer: "Al enviar, usted reconoce que este vehiculo se vende tal cual sin garantia.",
                return: "Volver al Inventario",
                form: {
                    name: "Nombre Completo",
                    phone: "Numero de Telefono",
                    email: "Correo Electronico"
                },
                specs: {
                    make: "Marca",
                    model: "Modelo",
                    exterior: "Exterior",
                    interior: "Interior",
                    paintFinish: "Acabado de Pintura",
                    bodyIntegrity: "Integridad de Carroceria",
                    glassOptics: "Vidrios / Optica",
                    inspected: "Inspeccionado",
                    upholstery: "Tapiceria",
                    controlsElectronics: "Controles y Electronica",
                    climateSystem: "Sistema de Clima",
                    functional: "Funcional"
                },
                conditionReport: "Reporte de Condicion",
                viewFullReport: "Ver Reporte Completo",
                noIssues: "Sin problemas importantes reportados",
                moreNoted: "mas registrados",
                transparencyProtocol: "Protocolo de Transparencia",
                transparencyDesc: "Proporcionamos transparencia completa en diagnosticos. Cada problema encontrado durante la inspeccion esta documentado a continuacion.",
                diagnosticLog: "Registro de Diagnostico",
                noFaultsLogged: "Sin Fallas Registradas",
                location: "Ubicacion",
                allSet: "TODO LISTO",
                advisorMsg: "Nuestra asesora Divine le llamara pronto sobre el",
                callUsNow: "Llamenos Ahora",
                backToInventory: "Volver al Inventario",
                fullscreen: "Pantalla Completa",
                aiAgent: "Agente de IA Disponible"
            },
            rental: {
                badge: "DISPONIBLE PARA RENTA",
                ratesLabel: "Tarifas de Renta",
                inquireRates: "Llame para Tarifas",
                tabLabel: "Rentar",
                formSubtitle: "Interesado en rentar este vehiculo? Envie su informacion y nuestro equipo le llamara para hablar sobre terminos, disponibilidad y requisitos.",
                successTitle: "CONSULTA RECIBIDA",
                successMsg: "Nuestro equipo le llamara pronto para hablar sobre los detalles de renta de este",
                disclaimer: "Las rentas requieren licencia de conducir valida, comprobante de seguro y deposito de seguridad. Las tarifas estan sujetas a disponibilidad.",
                submitButton: "Enviar Consulta de Renta"
            },
            sortOptions: {
                priceHighLow: "Precio: Mayor-Menor",
                priceLowHigh: "Precio: Menor-Mayor",
                yearNewest: "Ano: Mas Reciente",
                yearOldest: "Ano: Mas Antiguo",
                mileageLowHigh: "Millas: Menor-Mayor",
                allMakes: "Todas las Marcas"
            },
            formErrors: {
                invalidPhone: "Ingrese un numero de telefono valido de 10 digitos",
                nameRequired: "Ingrese su nombre",
                genericError: "Algo salio mal. Llamenos directamente al (832) 400-9760"
            }
        },
        vehicleDetail: {
            // Verificado
            verifiedBadge: "Verificado por Triple J",
            verifiedTooltip: "Este vehiculo ha sido inspeccionado y verificado por Triple J Auto Investment.",
            // Bloque de precio
            tripleJPrice: "Precio Triple J",
            marketAverage: "Promedio del Mercado",
            youSave: "Usted Ahorra",
            estMonthly: "Estimado Mensual",
            priceDisclaimer: "Est. ${amount}/mes con $500 de enganche. 24 meses. Sujeto a aprobacion. Consulte con el concesionario.",
            marketEstimateNote: "Valor Estimado del Mercado",
            // Historia del vehiculo
            vehicleStoryHeading: "Historia del Vehiculo",
            fallbackStory: "Contactenos para mas detalles sobre este vehiculo.",
            // Condicion
            conditionHeading: "Reporte de Condicion",
            // Especificaciones
            specsHeading: "Especificaciones del Vehiculo",
            specYear: "Ano",
            specMake: "Marca",
            specModel: "Modelo",
            specMileage: "Millaje",
            specVin: "VIN",
            specStatus: "Estado",
            specBodyType: "Tipo de Carroceria",
            specConditionNotes: "Notas de Condicion",
            // Prueba social
            listedToday: "Publicado hoy",
            listedYesterday: "Publicado ayer",
            listedDaysAgo: "Publicado hace {days} dias",
            // CTAs
            scheduleVisit: "Agende una Visita",
            callUs: "Llamenos",
            applyForFinancing: "Solicitar Financiamiento",
            // Navegacion
            backToInventory: "Volver al Inventario",
            // Compartir
            share: "Compartir",
            // Galeria de fotos
            photoCount: "{current} de {total}",
            noPhotos: "No hay fotos disponibles",
            // SEO
            seoDescription: "{year} {make} {model} - {mileage} millas. ${price}. Financiamiento interno disponible. Houston, TX.",
            // Enlace de tarjeta de inventario
            viewDetails: "Ver Detalles"
        },
        // Phase 15: Engagement Spectrum
        engagement: {
            // Nivel 0 - Guardar/Favorito
            save: "Guardar",
            saved: "Guardado",
            unsave: "Quitar de Guardados",
            savedVehicles: "Vehiculos Guardados",
            noSavedVehicles: "Aun no has guardado vehiculos",
            tapToSave: "Toca el corazon para guardar vehiculos que te gusten",
            viewAllInventory: "Ver Todo el Inventario",
            // Nivel 0 - Calculadora de Pagos
            paymentCalculator: "Calculadora de Pagos",
            downPayment: "Enganche",
            loanTerm: "Plazo del Prestamo",
            months: "meses",
            estimatedMonthly: "Pago Mensual Estimado",
            paymentDisclaimer: "Estimado solamente. Sujeto a aprobacion de credito. Consulte al distribuidor.",
            withDown: "con {amount} de enganche",
            // Nivel 1 - Acciones con telefono
            enterPhone: "Ingresa tu numero de telefono",
            phoneNumber: "Numero de Telefono",
            invalidPhone: "Por favor ingresa un numero de telefono valido",
            getPriceAlert: "Recibir Alerta de Precio",
            priceAlertDesc: "Te enviaremos un mensaje si el precio baja",
            similarVehicles: "Vehiculos Similares",
            similarDesc: "Te enviaremos opciones similares de nuestro inventario",
            vehicleReport: "Reporte del Vehiculo",
            reportDesc: "Recibe los detalles completos de la inspeccion",
            submitted: "Enviado!",
            wellBeInTouch: "Nos comunicaremos pronto",
            // Nivel 2 - Nombre + Telefono
            yourName: "Tu Nombre",
            scheduleVisit: "Agendar una Visita",
            scheduleDesc: "Ven a ver este vehiculo en persona",
            preferredTime: "Horario Preferido",
            morning: "Manana",
            afternoon: "Tarde",
            anytime: "Cualquier Hora",
            askQuestion: "Hacer una Pregunta",
            askDesc: "Responderemos dentro de una hora",
            yourQuestion: "Tu Pregunta",
            questionPlaceholder: "Que te gustaria saber sobre este vehiculo?",
            visitConfirmed: "Solicitud de Visita Enviada!",
            visitConfirmedDesc: "Te llamaremos para confirmar un horario",
            questionReceived: "Pregunta Recibida!",
            questionReceivedDesc: "Responderemos dentro de una hora",
            // Nivel 3 - Reservar
            reserveVehicle: "Reservar Este Vehiculo",
            reserveDesc: "Declara tu interes serio -- lo apartamos para ti",
            reserveNote: "No se requiere deposito. Te llamaremos dentro de una hora para discutir los siguientes pasos.",
            reserved: "Reservacion Enviada!",
            reservedDesc: "Apartaremos este vehiculo y te llamaremos pronto",
            reserveNow: "Reservar Ahora",
            // General
            submit: "Enviar",
            sending: "Enviando...",
            cancel: "Cancelar",
            callUs: "Llamanos",
            orCallDirectly: "O llamanos directamente",
            nameRequired: "El nombre es obligatorio",
            somethingWrong: "Algo salio mal. Intentalo de nuevo.",
        },
        contact: {
            title: "CONTACTENOS",
            subtitle: "Comuniquese con Nosotros",
            desc: "Envienos un mensaje. Respondemos dentro de una hora en horario laboral.",
            form: {
                name: "Nombre Completo",
                phone: "Numero de Telefono",
                email: "Correo Electronico",
                message: "Mensaje",
                submit: "Enviar Mensaje",
                submitting: "ENVIANDO...",
                sent: "MENSAJE ENVIADO",
                sentDesc: "Hemos recibido su mensaje. Esperelo dentro de 60 minutos en horario laboral.",
                reset: "Enviar Otro Mensaje",
                placeholders: {
                    name: "Su Nombre",
                    phone: "(XXX) XXX-XXXX",
                    email: "su@correo.com",
                    message: "Como podemos ayudarle?"
                }
            },
            info: {
                hq: "NUESTRA UBICACION",
                location: "Visitenos",
                openNav: "Como Llegar",
                directLine: "LLAMENOS",
                voice: "Telefono",
                hours: "HORARIO",
                window: "Tiempo de Respuesta",
                weekdays: "Lun - Sab",
                saturday: "Sabado",
                sunday: "Domingo",
                closed: "CERRADO"
            }
        },
        login: {
            title: "ACCESO ADMIN",
            subtitle: "Portal del Distribuidor",
            emailLabel: "Correo Electronico",
            emailPlaceholder: "Ingrese su correo",
            passwordLabel: "Contrasena",
            passwordPlaceholder: "Ingrese su contrasena",
            authenticate: "Iniciar Sesion",
            forgotAccess: "Olvido su Contrasena?",
            errorTitle: "Error de Acceso",
            errorMessage: "Correo o contrasena invalidos. Intente de nuevo.",
            recoveryTitle: "Enlace de Recuperacion Enviado",
            recoveryMessage: "Revise su correo para un enlace de recuperacion de contrasena.",
            secureNote: "Conexion segura. Solo personal autorizado."
        },
        faq: {
            badge: "Centro de Ayuda",
            title: "PREGUNTAS FRECUENTES",
            subtitle: "Preguntas frecuentes. Si su pregunta no esta aqui, contactenos directamente.",
            searchPlaceholder: "Buscar preguntas...",
            noResults: "No se encontraron resultados para",
            stillHaveQuestions: "TIENE MAS PREGUNTAS?",
            contactPrompt: "Contactenos directamente. Respondemos en una hora durante horario laboral.",
            contactCta: "CONTACTENOS",
            questions: [
                {
                    q: "Que tipo de vehiculos venden?",
                    a: "Triple J Auto Investment vende carros usados confiables -- sedanes, camionetas y SUVs con precios desde $3,000 hasta $8,000. Todos los vehiculos en nuestro lote son inspeccionados antes de ponerse a la venta. Nos enfocamos en vehiculos de transporte diario para familias de Houston."
                },
                {
                    q: "Puedo comprar un carro con mal credito en Houston?",
                    a: "Si, en Triple J Auto Investment puedes comprar un carro aunque tengas mal credito. Ofrecemos financiamiento para compradores con todo tipo de situacion crediticia, incluyendo puntajes bajos o sin historial de credito. Visitanos en 8774 Almeda Genoa Road o llama al (832) 400-9760 para hablar de tus opciones."
                },
                {
                    q: "Que es el financiamiento Buy Here Pay Here?",
                    a: "Buy Here Pay Here significa que el concesionario te financia el vehiculo directamente -- sin banco, sin esperar aprobacion. En Triple J Auto Investment, manejamos todo el proceso. Escoges tu carro, traes tus documentos, das tu enganche y te vas manejando el mismo dia. Los pagos se hacen directamente a Triple J."
                },
                {
                    q: "Cuanto es el enganche en Triple J Auto Investment?",
                    a: "Los enganches en Triple J Auto Investment empiezan desde $1,000. La cantidad exacta depende del vehiculo que escojas y tu presupuesto. Trabajamos contigo para encontrar un enganche que tenga sentido para ti. Llama al (832) 400-9760 para hablar de tu situacion."
                },
                {
                    q: "Necesito verificacion de credito para comprar un carro?",
                    a: "No, Triple J Auto Investment no requiere verificacion de credito tradicional para financiamiento interno. Nos enfocamos en tu capacidad de hacer pagos, no en tu puntaje de credito. Trae tu identificacion, comprobante de ingresos y comprobante de domicilio -- eso es todo lo que necesitas."
                },
                {
                    q: "Que documentos necesito para comprar un carro?",
                    a: "Para comprar un carro en Triple J Auto Investment necesitas tres documentos: licencia de conducir o identificacion oficial, comprobante de ingresos (talones de pago o estados de cuenta), y comprobante de domicilio (recibo de luz o contrato de renta). Tambien necesitas confirmacion de seguro antes de llevarte el vehiculo."
                },
                {
                    q: "Como funciona el financiamiento interno?",
                    a: "El financiamiento interno en Triple J Auto Investment significa que nosotros financiamos tu vehiculo directamente -- sin banco ni prestamista externo. Escoges un carro de nuestro lote, presentas tus documentos, das un enganche desde $1,000 y te vas manejando el mismo dia. Haces pagos semanales o quincenales directamente a Triple J. No se requiere verificacion de credito."
                },
                {
                    q: "Que carros puedo conseguir por menos de $5,000 en Houston?",
                    a: "Triple J Auto Investment tiene regularmente carros usados confiables por menos de $5,000 en Houston. Nuestro inventario incluye sedanes como Honda Accord, Toyota Camry y Ford Fusion -- todos inspeccionados y listos para manejar. Visita nuestro lote en 8774 Almeda Genoa Road o mira nuestro sitio web para ver la disponibilidad actual."
                },
                {
                    q: "Cual es el carro mas barato en Triple J Auto Investment?",
                    a: "Triple J Auto Investment tiene vehiculos usados desde aproximadamente $3,000. Nuestro inventario cambia seguido, asi que las opciones mas economicas varian. Todos los vehiculos son inspeccionados antes de listarse sin importar el precio. Revisa nuestro inventario en linea o llama al (832) 400-9760 para ver lo mas reciente."
                },
                {
                    q: "Tienen camionetas o SUVs por menos de $8,000?",
                    a: "Si, Triple J Auto Investment tiene SUVs y camionetas por menos de $8,000. Nuestro inventario incluye modelos populares como Chevy Equinox, Ford Explorer y Toyota 4Runner cuando estan disponibles. Todos son inspeccionados antes de listarse. Visita nuestro inventario en linea o ven a 8774 Almeda Genoa Road en Houston."
                },
                {
                    q: "Cuanto cuesta rentar un carro en Houston?",
                    a: "Triple J Auto Investment ofrece rentas de vehiculos accesibles en Houston por semana o por mes -- sin contratos a largo plazo. Las tarifas dependen del vehiculo y el periodo de renta. Llama al (832) 400-9760 para conocer las tarifas actuales y disponibilidad. Estamos en 8774 Almeda Genoa Road, Houston, TX 77075."
                },
                {
                    q: "Puedo rentar un carro sin tarjeta de credito en Houston?",
                    a: "Si, Triple J Auto Investment ofrece rentas de vehiculos en Houston sin necesidad de tarjeta de credito. Necesitas licencia de conducir valida, comprobante de seguro y deposito de seguridad. Llamanos al (832) 400-9760 para hablar de los requisitos y reservar un vehiculo."
                },
                {
                    q: "Ofrecen rentas semanales o mensuales de carros?",
                    a: "Si, Triple J Auto Investment ofrece rentas de vehiculos tanto semanales como mensuales en Houston. No se requieren contratos a largo plazo -- renta el tiempo que necesites. Se requiere licencia de conducir valida, comprobante de seguro y deposito de seguridad. Llama al (832) 400-9760 para tarifas y disponibilidad."
                },
                {
                    q: "Es Triple J Auto Investment un dealer con licencia?",
                    a: "Si, Triple J Auto Investment es un concesionario de autos con licencia completa en Texas. Nuestro numero de licencia es P171632. Operamos desde nuestro lote permanente en 8774 Almeda Genoa Road, Houston, TX 77075, y cumplimos con todas las regulaciones del Departamento de Vehiculos Motorizados de Texas."
                },
                {
                    q: "Como se si un carro usado es confiable?",
                    a: "Todos los vehiculos en Triple J Auto Investment son inspeccionados antes de ponerse a la venta. Proporcionamos informacion del historial del vehiculo y transparencia total de su condicion -- cualquier problema encontrado durante la inspeccion se documenta y se divulga. Tambien puedes usar nuestra herramienta gratuita de busqueda de VIN o traer tu propio mecanico para una inspeccion independiente."
                },
                {
                    q: "Que pasa despues de que compro un carro en Triple J?",
                    a: "Despues de comprar un vehiculo en Triple J Auto Investment, enviamos toda la documentacion de titulo y registro al DMV de Texas dentro de 48 horas. Recibes placas temporales validas por 60 dias mientras el estado procesa tus placas permanentes. Necesitas tener seguro antes de salir del lote."
                },
                {
                    q: "Ofrecen financiamiento?",
                    a: "Si, Triple J Auto Investment ofrece financiamiento interno sin verificacion de credito. Los enganches empiezan desde $1,000 y los pagos se hacen directamente a Triple J. Tambien trabajamos con prestamistas externos para compradores que prefieran financiamiento tradicional. Llama al (832) 400-9760 para hablar de opciones."
                },
                {
                    q: "Rentan vehiculos?",
                    a: "Si, Triple J Auto Investment ofrece rentas de vehiculos accesibles en Houston por semana o por mes. Sin contratos a largo plazo. Necesitas licencia de conducir valida, comprobante de seguro y deposito de seguridad. Llama al (832) 400-9760 para tarifas y disponibilidad."
                },
                {
                    q: "Donde estan ubicados?",
                    a: "Triple J Auto Investment esta ubicado en 8774 Almeda Genoa Road, Houston, Texas 77075. Servimos a familias en Houston, South Houston, Pasadena, Pearland y areas cercanas. Abiertos de lunes a sabado, 9:00 AM a 6:00 PM."
                },
                {
                    q: "Cual es su horario?",
                    a: "Triple J Auto Investment esta abierto de lunes a sabado, de 9:00 AM a 6:00 PM. Cerramos los domingos. Llama al (832) 400-9760 en horario de atencion o visitanos en 8774 Almeda Genoa Road, Houston, TX 77075."
                },
                {
                    q: "Hablan espanol?",
                    a: "Si, en Triple J Auto Investment somos completamente bilingues. Nuestro equipo habla ingles y espanol para servir a la comunidad de Houston. Visitenos en 8774 Almeda Genoa Road o llamenos al (832) 400-9760."
                },
                {
                    q: "Puedo dar mi carro como parte de pago?",
                    a: "Si, Triple J Auto Investment acepta vehiculos como parte de pago. Trae tu carro a nuestro lote en 8774 Almeda Genoa Road para una evaluacion justa y aplicamos el valor a tu proxima compra. Llama al (832) 400-9760 para programar una evaluacion."
                },
                {
                    q: "Sus vehiculos estan inspeccionados?",
                    a: "Si, todos los vehiculos en Triple J Auto Investment pasan por un proceso de inspeccion antes de ponerse a la venta. Documentamos cualquier problema encontrado y ofrecemos transparencia total sobre la condicion para que compres con confianza."
                }
            ]
        },
        services: {
            badge: "Lo Que Hacemos",
            title: "SERVICIOS",
            subtitle: "Todo lo que necesita para ponerse en camino con confianza.",
            learnMore: "Mas Informacion",
            list: [
                {
                    title: "Venta de Vehiculos",
                    desc: "Triple J Auto Investment vende vehiculos usados confiables en el rango de $3,000 a $8,000 para familias de Houston. Todos los vehiculos son inspeccionados antes de listarse.",
                    detail: "Visite nuestro lote en 8774 Almeda Genoa Road o nuestro sitio web para encontrar sedanes, camionetas y SUVs. Tenemos modelos populares como Honda Accord, Toyota Camry, Chevy Equinox y Ford Explorer. Precios transparentes en cada vehiculo -- sin cargos ocultos, sin sorpresas."
                },
                {
                    title: "Renta de Vehiculos",
                    desc: "Triple J Auto Investment ofrece rentas de vehiculos accesibles en Houston por semana o por mes. Sin contratos a largo plazo.",
                    detail: "Ya sea que necesite un vehiculo por una semana o un mes, nuestra flota de renta lo tiene cubierto. Se requiere licencia de conducir valida, comprobante de seguro y deposito de seguridad. Llame al (832) 400-9760 para tarifas y disponibilidad."
                },
                {
                    title: "Reportes de Historial VIN",
                    desc: "Triple J Auto Investment ofrece busqueda de VIN gratuita para que sepa exactamente lo que esta comprando antes de comprometerse.",
                    detail: "Proporcionamos informacion transparente del historial del vehiculo incluyendo reportes de accidentes, estado del titulo y registros de servicio cuando estan disponibles. Use nuestra herramienta de busqueda de VIN en linea o pregunte a nuestro equipo por un reporte completo."
                },
                {
                    title: "Financiamiento Interno",
                    desc: "Triple J Auto Investment ofrece financiamiento interno Buy Here Pay Here sin verificacion de credito. Enganches desde $1,000.",
                    detail: "Nosotros financiamos su vehiculo directamente -- sin banco, sin prestamista externo, sin esperar. Traiga su identificacion, comprobante de ingresos y comprobante de domicilio. Haga su enganche y vayase manejando el mismo dia. Tambien trabajamos con prestamistas externos para quienes prefieran financiamiento tradicional."
                },
                {
                    title: "Evaluacion de Intercambio",
                    desc: "Triple J Auto Investment acepta vehiculos como parte de pago y aplica el valor directamente a su proxima compra.",
                    detail: "Traiga su vehiculo a nuestro lote en 8774 Almeda Genoa Road para una evaluacion justa. Evaluaremos su intercambio y aplicaremos el valor a su compra. Llame al (832) 400-9760 para programar una evaluacion."
                }
            ],
            dontDo: {
                title: "LO QUE NO HACEMOS",
                items: [
                    { title: "Sin Garantias", desc: "Todas las ventas son TAL CUAL. No ofrecemos garantias, implicitas o expresas. Usted compra segun la condicion revelada." },
                    { title: "Sin Modificaciones Despues de la Venta", desc: "No realizamos trabajo mecanico, detallado o personalizacion despues de la compra. Los vehiculos se entregan tal como fueron inspeccionados." },
                    { title: "Sin Devoluciones ni Reembolsos", desc: "Todas las ventas son finales. Inspeccione a fondo antes de comprometerse. Estamos felices de responder preguntas antes de que compre." },
                    { title: "Sin Presion", desc: "Creemos en conversaciones honestas, no en tacticas de venta. Tome su tiempo, haga preguntas y decida cuando este listo." }
                ]
            }
        },
        about: {
            hero: {
                badge: "Nuestra Historia",
                title: "TRIPLE J AUTO INVESTMENT",
                subtitle: "Su socio automotriz de confianza en Houston."
            },
            story: {
                title: "Quienes Somos",
                p1: "Triple J Auto Investment es un concesionario independiente familiar en Houston, Texas. Nos especializamos en vehiculos usados de calidad que las familias pueden pagar -- carros confiables en el rango de $3,000 a $8,000 que lo llevan a donde necesita ir.",
                p2: "Ubicados en 8774 Almeda Genoa Road, servimos a la comunidad de Houston con ventas y rentas de vehiculos. Creemos que comprar un carro debe ser simple, honesto y hasta agradable. Sin presion, sin juegos -- solo servicio directo de personas que se preocupan.",
                p3: "Somos completamente bilingues, sirviendo a nuestra comunidad en ingles y espanol. Ya sea que este comprando su primer carro, mejorando para su familia que crece, o necesita una renta para pasar la semana, estamos aqui para ayudar."
            },
            values: {
                title: "Lo Que Representamos",
                v1Title: "Honestidad",
                v1Desc: "Precios transparentes, historiales honestos del vehiculo y conversaciones directas. Lo que ve es lo que obtiene.",
                v2Title: "Familia Primero",
                v2Desc: "Tratamos a cada cliente como familia. Su confianza importa mas que cualquier venta individual.",
                v3Title: "Comunidad",
                v3Desc: "Estamos orgullosos de ser parte de la comunidad de Houston. Somos sus vecinos y estamos aqui para quedarnos."
            },
            location: {
                title: "Visitenos",
                address: "8774 Almeda Genoa Road",
                city: "Houston, Texas 77075",
                phone: "(832) 400-9760",
                hours: "Lunes - Sabado: 9:00 AM - 6:00 PM",
                closed: "Domingo: Cerrado",
                directions: "Como Llegar"
            },
            cta: {
                title: "Listo para Encontrar Su Proximo Vehiculo?",
                desc: "Visite nuestro lote o explore nuestro inventario en linea. Estamos aqui para ayudarle a encontrar el carro correcto al precio correcto.",
                button: "Ver Inventario"
            }
        },
        finance: {
            badge: "Financiamiento",
            title: "OPCIONES DE FINANCIAMIENTO",
            subtitle: "Planes de pago flexibles para su presupuesto.",
            intro: "Triple J Auto Investment ofrece financiamiento interno Buy Here Pay Here sin verificacion de credito. Los enganches empiezan desde $1,000 y puedes irte manejando el mismo dia. Tambien trabajamos con prestamistas externos para opciones de financiamiento tradicional. Comprar un carro es una decision importante -- nosotros hacemos el financiamiento simple para que las familias de Houston obtengan transporte confiable sin complicaciones.",
            bhph: {
                processTitle: "Como Funciona el Buy Here Pay Here en Triple J",
                processIntro: "Buy Here Pay Here significa que Triple J Auto Investment financia tu vehiculo directamente -- sin banco, sin verificacion de credito, sin esperar aprobacion. Tratas con nosotros de principio a fin.",
                processSteps: [
                    { title: "Escoge Tu Vehiculo", desc: "Explora nuestro inventario de vehiculos usados inspeccionados con precios desde $3,000 hasta $8,000." },
                    { title: "Trae Tus Documentos", desc: "Identificacion oficial, comprobante de ingresos y comprobante de domicilio. Eso es todo lo que necesitas." },
                    { title: "Da Tu Enganche", desc: "Los enganches empiezan desde $1,000. Trabajamos con tu presupuesto para encontrar la cantidad adecuada." },
                    { title: "Vete Manejando Hoy", desc: "Una vez aprobado, te vas manejando tu vehiculo el mismo dia. Los pagos se hacen directamente a Triple J." }
                ],
                whyTitle: "Por Que Elegir Buy Here Pay Here?",
                whyItems: [
                    "Sin verificacion de credito",
                    "Sin aprobacion bancaria",
                    "Te vas manejando el mismo dia",
                    "Pagos directos a Triple J",
                    "Trabajamos con todo tipo de credito"
                ]
            },
            options: {
                title: "Como Funciona",
                step1Title: "Escoge Tu Vehiculo",
                step1Desc: "Explora nuestro inventario de vehiculos usados inspeccionados con precios desde $3,000 hasta $8,000.",
                step2Title: "Trae Tus Documentos",
                step2Desc: "Identificacion oficial, comprobante de ingresos y comprobante de domicilio. Sin verificacion de credito para financiamiento interno.",
                step3Title: "Vete Manejando Hoy",
                step3Desc: "Haz tu enganche (desde $1,000) y vete manejando a casa el mismo dia."
            },
            cta: {
                title: "Listo para Comenzar?",
                desc: "Contactenos para hablar sobre opciones de financiamiento para cualquier vehiculo en nuestro lote. Sin verificacion de credito para financiamiento interno.",
                button: "Contactenos",
                phone: "O llamenos al (832) 400-9760"
            },
            form: {
                downPayment: "Enganche",
                creditProfile: "Perfil de Credito",
                creditExcellent: "Excelente (750+)",
                creditGood: "Bueno (700-749)",
                creditFair: "Regular (650-699)",
                creditPoor: "Menos de 650",
                vehiclePlaceholder: "ej., 2018 Honda Civic",
                softInquiryNotice: "Al enviar, usted autoriza una consulta de credito suave que no afecta su puntaje crediticio."
            },
            requirements: {
                title: "Requisitos",
                items: [
                    "Licencia de conducir valida o identificacion oficial",
                    "Comprobante de ingresos (talones de pago o estados de cuenta)",
                    "Comprobante de domicilio (recibo de servicio o contrato de arrendamiento)",
                    "Confirmacion de cobertura de seguro"
                ]
            },
            rates: {
                title: "Tasas Estimadas",
                excellent: { label: "Credito Excelente", rate: "4.9% - 6.9%", detail: "Puntaje 750+, 20%+ de enganche" },
                good: { label: "Buen Credito", rate: "7.9% - 10.9%", detail: "Puntaje 700-749, 15%+ de enganche" },
                fair: { label: "Credito Regular", rate: "11.9% - 16.9%", detail: "Puntaje 650-699, 25%+ de enganche requerido" },
                disclaimer: "*Las tasas estan sujetas a cambio. La APR final la determina el prestamista segun su perfil crediticio completo."
            },
            importantNotice: {
                title: "Aviso Importante",
                content: "El financiamiento esta sujeto a aprobacion por prestamistas de terceros. Triple J Auto Investment no proporciona financiamiento directo. Somos un concesionario, no un banco."
            }
        },
        policies: {
            title: "POLITICAS",
            subtitle: "Nuestro compromiso con la transparencia.",
            privacy: {
                title: "Politica de Privacidad",
                content: "Triple J Auto Investment esta comprometido a proteger su privacidad. Solo recopilamos la informacion necesaria para servirle y nunca vendemos sus datos personales a terceros. Cualquier informacion que proporcione -- incluyendo su nombre, numero de telefono y correo electronico -- se usa unicamente para asistirle con consultas de vehiculos, financiamiento y comunicaciones de servicio."
            },
            terms: {
                title: "Terminos de Servicio",
                content: "Todos los vehiculos se venden tal cual a menos que se indique lo contrario por escrito. Los precios listados en nuestro sitio web estan sujetos a cambio sin previo aviso. La disponibilidad del vehiculo no esta garantizada hasta que se firme un acuerdo de compra. Al usar este sitio web, usted acepta estos terminos."
            },
            returns: {
                title: "Politica de Devolucion",
                content: "Todas las ventas son finales. Animamos a todos los compradores a inspeccionar los vehiculos a fondo y revisar toda la documentacion antes de completar una compra. Estamos felices de responder cualquier pregunta antes de que compre."
            },
            asIs: {
                title: "Politica de Venta TAL CUAL",
                noWarranties: "Sin Garantias",
                noReturns: "Sin Devoluciones",
                mainWarning: "TODOS LOS VEHICULOS SE VENDEN \"TAL CUAL\" SIN GARANTIAS, EXPRESAS O IMPLICITAS.",
                p1: "Esto significa que usted esta comprando el vehiculo en su condicion actual, con todas las fallas existentes, conocidas o desconocidas.",
                p2: "Triple J Auto Investment no hace garantias sobre la condicion mecanica, electrica, estetica u operativa de ningun vehiculo. Aunque proporcionamos divulgaciones de diagnostico cuando estan disponibles, no garantizamos que dichas divulgaciones sean exhaustivas o completas.",
                acknowledge: "Al completar una compra, usted reconoce que:",
                items: [
                    "Ha inspeccionado el vehiculo o ha renunciado a su derecho de hacerlo",
                    "Todas las reparaciones posteriores a la venta son su responsabilidad exclusiva",
                    "No se permiten reembolsos, cambios ni devoluciones",
                    "Acepta todo riesgo de mal funcionamiento o falla futura"
                ]
            },
            payment: {
                title: "Politica de Pago",
                acceptedMethods: "Metodos Aceptados",
                methodsTitle: "Metodos de Pago Aceptados",
                methods: [
                    { method: "Efectivo:", detail: "Entrega inmediata del vehiculo" },
                    { method: "Cheque de Caja:", detail: "Entrega verificada el mismo dia" },
                    { method: "Tarjeta de Debito:", detail: "Aceptada para depositos y pagos" },
                    { method: "Cheque Personal:", detail: "Retencion de 3-5 dias habiles para verificacion" },
                    { method: "Financiamiento Aprobado:", detail: "Entrega tras confirmacion de fondos del prestamista" }
                ],
                deposit: {
                    title: "Politica de Deposito",
                    content: "Se pueden requerir depositos no reembolsables para reservar un vehiculo. Los depositos se aplican al precio final de compra. Si el comprador no completa la compra dentro del plazo acordado, el deposito se pierde."
                }
            },
            titleRegistration: {
                title: "Politica de Titulo y Registro",
                compliance: "Cumplimiento del DMV de Texas",
                introBefore: "Enviamos toda la documentacion requerida al DMV de Texas dentro de",
                introHighlight: "48 horas",
                introAfter: "de la venta completada. El tiempo de procesamiento lo controla el estado, no Triple J Auto Investment.",
                buyerTitle: "Responsabilidades del Comprador",
                buyerItems: [
                    "Obtener cobertura de seguro valida antes de tomar posesion",
                    "Completar prueba de emisiones si lo requiere el condado",
                    "Pagar todos los impuestos estatales y locales aplicables, tarifas de titulo y registro",
                    "Proporcionar identificacion oficial valida y comprobante de domicilio"
                ],
                outOfStateLabel: "Compradores de Fuera del Estado:",
                outOfState: "Usted es responsable de entender y cumplir con los requisitos de registro de su estado. Proporcionamos toda la documentacion necesaria pero no garantizamos la aceptacion por el DMV de su estado."
            },
            inspection: {
                title: "Politica de Inspeccion y Prueba de Manejo",
                prePurchaseTitle: "Inspecciones Pre-Compra",
                prePurchaseContent: "Los compradores pueden organizar inspecciones mecanicas independientes a su cargo. El inspector debe tener licencia y seguro. Las inspecciones deben programarse con anticipacion y completarse en nuestras instalaciones durante horario laboral.",
                testDriveTitle: "Pruebas de Manejo",
                testDriveItems: [
                    "Se requiere licencia de conducir valida",
                    "Se puede requerir comprobante de seguro",
                    "Las rutas son predeterminadas por el personal de Triple J",
                    "El conductor asume toda la responsabilidad durante la prueba de manejo"
                ]
            },
            privacyConsent: "Al proporcionar su informacion, usted consiente la comunicacion por telefono, correo electronico o SMS sobre su consulta o compra."
        },
        legal: {
            title: "LEGAL",
            subtitle: "Informacion legal y divulgaciones.",
            dealerInfo: {
                title: "Informacion del Distribuidor",
                name: "Triple J Auto Investment",
                license: "Licencia de Distribuidor de Texas: P171632",
                address: "8774 Almeda Genoa Road, Houston, Texas 77075"
            },
            disclaimer: {
                title: "Aviso Legal",
                content: "Todos los vehiculos se venden tal cual. Los precios y disponibilidad estan sujetos a cambio. Las fotos pueden no representar el vehiculo exacto. Contactenos para la informacion mas actualizada."
            },
            backToHome: "Volver al Inicio"
        },
        notFound: {
            title: "PAGINA NO ENCONTRADA",
            subtitle: "La pagina que busca no existe o ha sido movida.",
            homeButton: "Ir al Inicio",
            contactButton: "Contactenos"
        },
        vinLookup: {
            badge: "Historial del Vehiculo",
            title: "BUSQUEDA DE VIN",
            subtitle: "Ingrese un VIN para verificar el historial y detalles del vehiculo.",
            placeholder: "Ingrese VIN de 17 digitos",
            search: "Buscar VIN",
            searching: "Buscando...",
            results: "Detalles del Vehiculo",
            noResults: "No se encontro informacion para este VIN. Verifique el numero e intente de nuevo.",
            logs: {
                connecting: "Conectando a la base de datos de vehiculos...",
                accessGranted: "Conexion establecida.",
                decoding: "Buscando VIN:",
                extracting: "Datos del vehiculo obtenidos.",
                populating: "Organizando resultados...",
                rendering: "Preparando reporte...",
                processing: "Cargando...",
                initializing: "Listo",
                connectionFailed: "Error de conexion. Intente de nuevo.",
                dataError: "Error de datos:"
            },
            fields: {
                make: "Marca",
                model: "Modelo",
                year: "Ano",
                waitingForInput: "Esperando entrada...",
                dataStream: "Registro de Estado",
                quickDecode: "Busqueda Rapida"
            },
            resultLabels: {
                manufacturer: "Fabricante (Marca)",
                model: "Modelo",
                year: "Ano",
                bodyType: "Tipo de Carroceria",
                detailedConfig: "Configuracion Detallada",
                trimLevel: "Nivel de Equipamiento",
                series: "Serie",
                transmission: "Transmision",
                doors: "Puertas",
                engineSpecs: "Motor y Rendimiento",
                cylinders: "Cilindros",
                horsepower: "Caballos de Fuerza",
                drivetrain: "Tren Motriz",
                fuelSystem: "Sistema de Combustible",
                standardCombustion: "Combustion Estandar",
                manufacturingOrigin: "Origen de Fabricacion",
                plant: "Planta",
                mfgEntity: "Fabricante",
                verified: "Verificado"
            },
            vinLabel: "Numero de Identificacion del Vehiculo",
            decode: "DECODIFICAR",
            decodeAnother: "Decodificar Otro VIN",
            baseTrim: "Base",
            doorSuffix: "Puertas",
            errors: {
                lettersOnly: "Solo se permiten letras y numeros",
                forbiddenChar: "no esta permitido en VINs (I, O, Q estan prohibidos)",
                exactLength: "El VIN debe tener exactamente 17 caracteres",
                currently: "actualmente",
                noData: "No se encontraron datos del vehiculo para este VIN. Verifique el numero e intente de nuevo."
            }
        },
        paymentOptions: {
            badge: "Pagos",
            title: "OPCIONES DE PAGO",
            subtitle: "Formas flexibles de pagar su vehiculo.",
            methods: {
                title: "Metodos de Pago Aceptados",
                cash: "Efectivo",
                cashDesc: "Pague en su totalidad en nuestro concesionario.",
                financing: "Financiamiento",
                financingDesc: "Planes de pago mensuales disponibles. Hable con nuestro equipo sobre opciones.",
                debit: "Tarjeta de Debito",
                debitDesc: "Aceptada para depositos y pagos.",
                cashiers: "Cheque de Caja",
                cashiersDesc: "Aceptado para compras completas de vehiculos."
            },
            note: "Para preguntas sobre opciones de pago, llamenos al (832) 400-9760.",
            fraud: {
                title: "Prevencion de Fraude",
                content: "Triple J Auto Investment nunca le pedira pagos por transferencia bancaria, tarjetas de regalo o criptomonedas. Si recibe una solicitud sospechosa que dice ser de nosotros, llame al (832) 400-9760 para verificar."
            },
            cashAdvantages: {
                title: "Ventajas",
                items: [
                    "Recoja el mismo dia",
                    "Sin cargos de financiamiento ni intereses",
                    "Mejor posicion de negociacion",
                    "No se requiere verificacion de credito"
                ],
                irsNote: "Transacciones mayores a $10,000 requieren reporte del formulario IRS 8300."
            },
            cashiersRequirements: {
                title: "Requisitos",
                items: [
                    "Debe ser de un banco estadounidense",
                    "A nombre de \"Triple J Auto Investment\"",
                    "Sujeto a llamada de verificacion bancaria",
                    "Traiga identificacion oficial valida"
                ]
            },
            debitDetails: {
                title: "Detalles",
                items: [
                    "Aceptada para depositos y pagos parciales",
                    "Pueden aplicar limites diarios segun su banco",
                    "Autorizacion con PIN o firma"
                ]
            },
            financingRequirements: {
                title: "Requisitos",
                items: [
                    "Puntaje de credito 580+ (minimo)",
                    "Comprobante de ingresos y domicilio",
                    "Cobertura de seguro valida",
                    "Enganche 10-25% (segun puntaje)"
                ]
            },
            personalCheck: {
                title: "Cheques Personales Aceptados con Retencion",
                before: "Aceptamos cheques personales, pero la entrega del vehiculo se retrasa",
                holdPeriod: "3-5 dias habiles",
                after: "para verificacion bancaria. Si necesita recoger inmediatamente, use efectivo, cheque de caja o tarjeta de debito."
            }
        },
        polish: {
            // Sin conexion
            offlineBanner: "Parece que no tienes conexion. Algunas funciones pueden no estar disponibles.",

            // Error de conexion
            connectionError: "Problemas de conexion. Algunas funciones pueden no estar disponibles.",
            connectionRetry: "Reintentar",
            connectionCallUs: "Llamenos al (832) 400-9760",

            // Estados de carga
            loadingInventory: "Cargando inventario...",
            loadingPage: "Cargando...",
            loadingSubmitting: "Enviando...",
            loadingSending: "Enviando...",

            // Estados vacios
            emptyInventory: "No hay vehiculos disponibles en este momento. Vuelva pronto!",
            emptyInventorySubtext: "Agregamos vehiculos nuevos a nuestro inventario regularmente.",
            emptyDashboard: "No se encontraron registros.",
            emptyDashboardSubtext: "Cuando compre un vehiculo, los detalles de su registro apareceran aqui.",

            // Estados de error
            errorGeneric: "Algo salio mal. Por favor, intente de nuevo.",
            errorFormSubmit: "No pudimos enviar su informacion. Intente de nuevo o llamenos.",
            errorLoadFailed: "Error al cargar. Verifique su conexion e intente de nuevo.",
            errorReload: "Recargar Pagina",
            errorTryAgain: "Intentar de Nuevo",
            errorCallUs: "O llamenos",

            // Accesibilidad
            skipToContent: "Ir al contenido principal",
            closeModal: "Cerrar",
            previousImage: "Imagen anterior",
            nextImage: "Siguiente imagen",
            openMenu: "Abrir menu",
            closeMenu: "Cerrar menu",
            switchLanguage: "Cambiar idioma"
        }
    }
};
