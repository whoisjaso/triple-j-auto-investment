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
            viewInventory: "View Inventory"
        },
        home: {
            hero: {
                title1: "YOUR NEXT",
                title2: "VEHICLE",
                subtitle: "Reliable pre-owned cars for Houston families. Transparent pricing, no surprises.",
                cta: "View Inventory",
                callNow: "Call Now"
            },
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
                }
            }
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
                    a: "We specialize in reliable, pre-owned vehicles in the $3,000 to $8,000 range. Our inventory includes sedans, SUVs, trucks, and more -- all inspected and ready to drive."
                },
                {
                    q: "Do you offer financing?",
                    a: "Yes, we offer financing options to help you get on the road. Contact us to discuss payment plans that work for your budget."
                },
                {
                    q: "Do you rent vehicles?",
                    a: "Yes, we offer vehicle rentals in addition to sales. Contact us for availability, pricing, and rental terms."
                },
                {
                    q: "Where are you located?",
                    a: "We're located at 8774 Almeda Genoa Road, Houston, Texas 77075. We're easy to find and happy to help when you visit."
                },
                {
                    q: "What are your business hours?",
                    a: "We're open Monday through Saturday, 9:00 AM to 6:00 PM. We're closed on Sundays."
                },
                {
                    q: "Do you speak Spanish?",
                    a: "Yes! We're fully bilingual. Our team speaks both English and Spanish to serve the Houston community."
                },
                {
                    q: "Can I trade in my current vehicle?",
                    a: "Yes, we accept trade-ins. Bring your vehicle in for a fair assessment and we'll apply the value toward your next purchase."
                },
                {
                    q: "Are your vehicles inspected?",
                    a: "Every vehicle on our lot goes through an inspection process before being listed for sale. We want you to drive away with confidence."
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
                    desc: "Quality pre-owned vehicles in the $3,000-$8,000 range. Every car is inspected and priced transparently.",
                    detail: "Browse our lot or website to find a vehicle that fits your needs and budget. We're here to answer questions and help you make a confident choice."
                },
                {
                    title: "Vehicle Rentals",
                    desc: "Need a vehicle for a short time? We offer rental options to keep you moving.",
                    detail: "Whether you need a vehicle for a week or a month, our rental fleet has you covered. Contact us for rates and availability."
                },
                {
                    title: "VIN History Reports",
                    desc: "Full vehicle history reports so you know exactly what you're buying.",
                    detail: "We provide transparent vehicle history information including accident reports, title status, and service records when available."
                },
                {
                    title: "Financing Assistance",
                    desc: "Flexible payment options to help you get behind the wheel.",
                    detail: "We work with you to find a financing plan that fits your budget. Talk to our team about available options."
                },
                {
                    title: "Trade-In Assessment",
                    desc: "Get a fair value for your current vehicle toward your next purchase.",
                    detail: "Bring your vehicle in and we'll give you an honest assessment. The trade-in value can be applied directly to your purchase."
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
            intro: "We understand that buying a car is a big decision. That's why we offer financing options designed to make it easier for Houston families to get reliable transportation.",
            options: {
                title: "How It Works",
                step1Title: "Choose Your Vehicle",
                step1Desc: "Browse our inventory and find the car that's right for you.",
                step2Title: "Talk to Our Team",
                step2Desc: "We'll discuss payment options that fit your budget and situation.",
                step3Title: "Drive Away Happy",
                step3Desc: "Complete the paperwork and drive home in your new vehicle."
            },
            cta: {
                title: "Ready to Get Started?",
                desc: "Contact us to discuss financing options for any vehicle on our lot.",
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
            viewInventory: "Ver Inventario"
        },
        home: {
            hero: {
                title1: "TU PROXIMO",
                title2: "VEHICULO",
                subtitle: "Carros usados confiables para familias de Houston. Precios transparentes, sin sorpresas.",
                cta: "Ver Inventario",
                callNow: "Llamar Ahora"
            },
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
                }
            }
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
                    a: "Nos especializamos en vehiculos usados confiables en el rango de $3,000 a $8,000. Nuestro inventario incluye sedanes, camionetas, SUVs y mas -- todos inspeccionados y listos para manejar."
                },
                {
                    q: "Ofrecen financiamiento?",
                    a: "Si, ofrecemos opciones de financiamiento para ayudarle a ponerse en camino. Contactenos para hablar sobre planes de pago que funcionen para su presupuesto."
                },
                {
                    q: "Rentan vehiculos?",
                    a: "Si, ofrecemos rentas de vehiculos ademas de ventas. Contactenos para disponibilidad, precios y terminos de renta."
                },
                {
                    q: "Donde estan ubicados?",
                    a: "Estamos ubicados en 8774 Almeda Genoa Road, Houston, Texas 77075. Somos faciles de encontrar y estamos felices de ayudarle cuando nos visite."
                },
                {
                    q: "Cual es su horario?",
                    a: "Estamos abiertos de lunes a sabado, de 9:00 AM a 6:00 PM. Cerramos los domingos."
                },
                {
                    q: "Hablan espanol?",
                    a: "Si! Somos completamente bilingues. Nuestro equipo habla ingles y espanol para servir a la comunidad de Houston."
                },
                {
                    q: "Puedo dar mi carro como parte de pago?",
                    a: "Si, aceptamos vehiculos como parte de pago. Traiga su vehiculo para una evaluacion justa y aplicaremos el valor a su proxima compra."
                },
                {
                    q: "Sus vehiculos estan inspeccionados?",
                    a: "Cada vehiculo en nuestro lote pasa por un proceso de inspeccion antes de ser puesto a la venta. Queremos que maneje con confianza."
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
                    desc: "Vehiculos usados de calidad en el rango de $3,000-$8,000. Cada carro es inspeccionado y tiene precio transparente.",
                    detail: "Visite nuestro lote o sitio web para encontrar un vehiculo que se ajuste a sus necesidades y presupuesto. Estamos aqui para responder preguntas y ayudarle a tomar una decision segura."
                },
                {
                    title: "Renta de Vehiculos",
                    desc: "Necesita un vehiculo por un tiempo? Ofrecemos opciones de renta para mantenerlo en movimiento.",
                    detail: "Ya sea que necesite un vehiculo por una semana o un mes, nuestra flota de renta lo tiene cubierto. Contactenos para tarifas y disponibilidad."
                },
                {
                    title: "Reportes de Historial VIN",
                    desc: "Reportes completos de historial del vehiculo para que sepa exactamente lo que esta comprando.",
                    detail: "Proporcionamos informacion transparente del historial del vehiculo incluyendo reportes de accidentes, estado del titulo y registros de servicio cuando estan disponibles."
                },
                {
                    title: "Asistencia de Financiamiento",
                    desc: "Opciones de pago flexibles para ayudarle a ponerse al volante.",
                    detail: "Trabajamos con usted para encontrar un plan de financiamiento que se ajuste a su presupuesto. Hable con nuestro equipo sobre las opciones disponibles."
                },
                {
                    title: "Evaluacion de Intercambio",
                    desc: "Obtenga un valor justo por su vehiculo actual para su proxima compra.",
                    detail: "Traiga su vehiculo y le daremos una evaluacion honesta. El valor del intercambio se puede aplicar directamente a su compra."
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
            intro: "Entendemos que comprar un carro es una decision importante. Por eso ofrecemos opciones de financiamiento disenadas para facilitar que las familias de Houston obtengan transporte confiable.",
            options: {
                title: "Como Funciona",
                step1Title: "Elija Su Vehiculo",
                step1Desc: "Explore nuestro inventario y encuentre el carro adecuado para usted.",
                step2Title: "Hable con Nuestro Equipo",
                step2Desc: "Hablaremos sobre opciones de pago que se ajusten a su presupuesto y situacion.",
                step3Title: "Vayase Feliz",
                step3Desc: "Complete el papeleo y vayase a casa en su nuevo vehiculo."
            },
            cta: {
                title: "Listo para Comenzar?",
                desc: "Contactenos para hablar sobre opciones de financiamiento para cualquier vehiculo en nuestro lote.",
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
        }
    }
};
