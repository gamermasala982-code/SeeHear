export const LANGUAGES = [
  { id: 'en', label: 'English', nativeLabel: 'English', isIllustrative: false },
  { id: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', isIllustrative: false },
  {
    id: 'hinglish',
    label: 'Hinglish (Illustrative Demo)',
    nativeLabel: 'Hinglish (Demo)',
    isIllustrative: true,
  },
];

export const EXPLANATION_STYLES = [
  { id: 'simple', label: 'Simple & Everyday' },
  { id: 'detailed', label: 'Detailed Breakdown' },
  { id: 'exam', label: 'Exam-Focused Key Points' },
];

export const SAMPLE_DOCUMENTS = [
  {
    id: 'doc-constitution',
    title: 'Constitutional Foundations: Article 21 & Due Process in India',
    author: 'Prof. R. Subramanian — National Law Review Monograph',
    category: 'Constitutional Law & Civics',
    pages: 14,
    estimatedMinutes: 18,
    dateAdded: '2025-02-10',
    sourceType: 'Built-in Verified Sample',
    summary:
      'Analyzes the judicial transformation of Article 21 from a narrow procedural safeguard in A.K. Gopalan (1950) to a substantive guarantee of fairness and dignity in Maneka Gandhi (1978).',
    sections: [
      {
        id: 'sec-c1',
        pageRef: 'Page 2, Section 1.1',
        heading: 'The Textual Core of Article 21',
        originalText:
          'Article 21 of the Constitution of India states: "No person shall be deprived of his life or personal liberty except according to procedure established by law." In early jurisprudence, notably A.K. Gopalan v. State of Madras (1950), the Supreme Court interpreted "procedure established by law" literally—meaning any enacted statutory procedure sufficed, provided the legislature possessed competence.',
        translations: {
          hi: 'भारतीय संविधान के अनुच्छेद 21 में कहा गया है: "किसी भी व्यक्ति को उसके प्राण या दैहिक स्वतंत्रता से विधि द्वारा स्थापित प्रक्रिया के अनुसार ही वंचित किया जाएगा, अन्यथा नहीं।" प्रारंभिक न्यायशास्त्र में, विशेष रूप से ए.के. गोपालन बनाम मद्रास राज्य (1950) में, सर्वोच्च न्यायालय ने "विधि द्वारा स्थापित प्रक्रिया" की शाब्दिक व्याख्या की—जिसका अर्थ था कि विधायिका द्वारा पारित कोई भी वैधानिक प्रक्रिया पर्याप्त थी।',
          hinglish:
            'Indian Constitution ka Article 21 kehta hai ki kisi bhi insaan ki life ya personal liberty ko bina "procedure established by law" ke छीना nahi ja sakta. Starting mein, A.K. Gopalan case (1950) mein Supreme Court ne iska literal meaning liya—matlab agar Parliament ne koi law pass kar diya, toh woh procedure valid maana jayega chahe woh kitna bhi strict ho.',
        },
        explanations: {
          simple: {
            en: 'In 1950, the Supreme Court treated Article 21 like a checklist: as long as Parliament followed the rules to pass a law, courts would not question whether that law itself was fair or unfair.',
            hi: '1950 में, सर्वोच्च न्यायालय ने अनुच्छेद 21 को केवल एक नियम-सूची की तरह देखा: जब तक संसद ने कानून बनाने की प्रक्रिया का पालन किया, अदालतें यह सवाल नहीं उठाती थीं कि वह कानून स्वयं न्यायसंगत है या नहीं।',
            hinglish:
              'Simple shabdon mein: 1950 mein Court ka maanna tha ki agar सरकार ne sahi process se law banaya hai, toh Court yeh check nahi karegi ki woh law fair hai ya unfair.',
          },
          detailed: {
            en: 'The framers purposefully adopted the phrase "procedure established by law" (inspired by Article 31 of the Japanese Constitution) rather than the American "due process of law." In Gopalan, the majority held that fundamental rights operated in isolated silos (the "watertight compartments" theory), preventing Article 14 (equality) or Article 19 (freedoms) from testing the reasonableness of a law depriving personal liberty under Article 21.',
            hi: 'संविधान निर्माताओं ने अमेरिकी "ड्यू प्रोसेस ऑफ लॉ" के स्थान पर जापानी संविधान के अनुच्छेद 31 से प्रेरित "विधि द्वारा स्थापित प्रक्रिया" वाक्यांश को अपनाया। गोपालन मामले में न्यायालय ने माना कि मौलिक अधिकार अलग-अलग खानों (watertight compartments) में काम करते हैं, इसलिए अनुच्छेद 14 या 19 के तहत किसी कानून की निष्पक्षता की जाँच नहीं की जा सकती।',
            hinglish:
              'Framers ne American "due process" ki jagah Japanese Constitution se inspired "procedure established by law" choose kiya. Gopalan judgment ne Fundamental Rights ko separate silos ("watertight compartments") maana, jiske kaaran Article 14 aur 19 ke fairness standards ko Article 21 par apply nahi kiya gaya.',
          },
          exam: {
            en: `• Case Citation: A.K. Gopalan v. State of Madras (AIR 1950 SC 27).
• Core Doctrine: Literal/Positivist interpretation of "procedure established by law".
• Key Phrase: Fundamental rights as mutually exclusive "watertight compartments".
• Later Overruled By: R.C. Cooper (1970) and Maneka Gandhi v. Union of India (1978).`,
            hi: `• प्रमुख वाद: ए.के. गोपालन बनाम मद्रास राज्य (1950)।
• मूल सिद्धांत: "विधि द्वारा स्थापित प्रक्रिया" की शाब्दिक व्याख्या।
• मुख्य अवधारणा: मौलिक अधिकार अलग-अलग "जलरोधी कक्ष" (watertight compartments) हैं।
• बाद में उलटा गया: मेनका गांधी बनाम भारत संघ (1978) द्वारा।`,
            hinglish: `• Case: A.K. Gopalan v. State of Madras (1950).
• Doctrine: Literal interpretation of "procedure established by law".
• Key Concept: Fundamental Rights as "watertight compartments".
• Overruled In: Maneka Gandhi v. Union of India (1978).`,
          },
        },
      },
      {
        id: 'sec-c2',
        pageRef: 'Page 7, Section 2.4',
        heading: 'The Maneka Gandhi Shift & Golden Triangle',
        originalText:
          'In Maneka Gandhi v. Union of India (1978), the Supreme Court abandoned the isolated reading of Fundamental Rights. It ruled that any procedure depriving a person of personal liberty must not be arbitrary, unfair, or unreasonable. Consequently, Articles 14, 19, and 21 form an integrated "Golden Triangle" of constitutional protection.',
        translations: {
          hi: 'मेनका गांधी बनाम भारत संघ (1978) में, सर्वोच्च न्यायालय ने मौलिक अधिकारों को अलग-अलग पढ़ने के दृष्टिकोण को त्याग दिया। न्यायालय ने निर्णय दिया कि व्यक्तिगत स्वतंत्रता से वंचित करने वाली कोई भी प्रक्रिया मनमानी, अनुचित या अतार्किक नहीं होनी चाहिए। परिणामस्वरूप, अनुच्छेद 14, 19 और 21 संवैधानिक संरक्षण का एक एकीकृत "स्वर्णिम त्रिभुज" (Golden Triangle) बनाते हैं।',
          hinglish:
            'Maneka Gandhi v. Union of India (1978) mein Supreme Court ne purana isolated reading drop kar diya. Court ne rule kiya ki personal liberty छीनने wala koi bhi procedure arbitrary, unfair ya unreasonable nahi ho sakta. Is tarah Articles 14, 19 aur 21 milkar ek "Golden Triangle" banate hain.',
        },
        explanations: {
          simple: {
            en: 'After 1978, a law taking away your freedom cannot just exist on paper—the law and its procedure must be fair, reasonable, and equal for everyone.',
            hi: '1978 के बाद, आपकी स्वतंत्रता छीनने वाला कोई भी कानून केवल कागज़ पर वैध होने से काम नहीं चलेगा—वह कानून और उसकी प्रक्रिया स्वयं भी निष्पक्ष, तार्किक और समान होनी चाहिए।',
            hinglish:
              '1978 ke baad rule clear ho gaya: सरकार sirf law pass karke kisi ki liberty nahi rok sakti; woh law fair, logical aur non-arbitrary hona zaroori hai.',
          },
          detailed: {
            en: 'When Maneka Gandhi’s passport was impounded without a hearing under Section 10(3)(c) of the Passports Act, 1967, the Court held that "procedure" under Article 21 must satisfy the test of non-arbitrariness under Article 14 and reasonableness under Article 19. This effectively introduced substantive due process into Indian constitutional law.',
            hi: 'जब पासपोर्ट अधिनियम, 1967 की धारा 10(3)(c) के तहत बिना सुनवाई के मेनका गांधी का पासपोर्ट जब्त कर लिया गया, तो न्यायालय ने कहा कि अनुच्छेद 21 की प्रक्रिया को अनुच्छेद 14 (गैर-मनमानापन) और अनुच्छेद 19 (तार्किकता) की कसौटी पर खरा उतरना होगा।',
            hinglish:
              'Jab Passports Act 1967 ke under bina hearing ke passport impound hua, toh SC ne kaha ki Article 21 ka procedure Article 14 (equality/non-arbitrariness) aur Article 19 (reasonableness) dono ko satisfy karna chahiye.',
          },
          exam: {
            en: `• Case Citation: Maneka Gandhi v. Union of India (AIR 1978 SC 597).
• Golden Triangle: Inter-relationship of Articles 14, 19, and 21.
• Natural Justice: Audi alteram partem (right to be heard) implied in fair procedure.
• Effect: Introduced substantive due process into Article 21.`,
            hi: `• वाद: मेनका गांधी बनाम भारत संघ (1978)।
• स्वर्णिम त्रिभुज: अनुच्छेद 14, 19 और 21 का परस्पर संबंध।
• प्राकृतिक न्याय: सुनवाई का अधिकार (Audi alteram partem) निष्पक्ष प्रक्रिया का हिस्सा है।`,
            hinglish: `• Case: Maneka Gandhi v. Union of India (1978).
• Golden Triangle: Articles 14 + 19 + 21 read together.
• Natural Justice: Right to be heard (Audi alteram partem) is mandatory.`,
          },
        },
      },
    ],
  },
  {
    id: 'doc-thermodynamics',
    title: 'Entropy, Microstates & The Second Law of Thermodynamics',
    author: 'Dr. Ananya Verma — Dept. of Physics Lecture Notes',
    category: 'Physics & Engineering',
    pages: 11,
    estimatedMinutes: 15,
    dateAdded: '2025-02-12',
    sourceType: 'Built-in Verified Sample',
    summary:
      'Bridges classical Clausius macro-thermodynamics with Ludwig Boltzmann’s statistical mechanics interpretation of entropy and spontaneous processes.',
    sections: [
      {
        id: 'sec-t1',
        pageRef: 'Page 3, Section 1.2',
        heading: 'Statistical Definition of Entropy (Boltzmann Equation)',
        originalText:
          'In statistical mechanics, entropy (S) measures the number of microscopic configurations (microstates, Ω) consistent with a macroscopic thermodynamic state: S = k_B ln(Ω), where k_B is Boltzmann’s constant (1.38 × 10^-23 J/K). Isolated systems evolve toward macrostates with the highest multiplicity Ω simply because those states are overwhelmingly more probable.',
        translations: {
          hi: 'सांख्यिकीय यांत्रिकी में, एन्ट्रॉपी (S) उन सूक्ष्म अवस्थाओं (microstates, Ω) की संख्या को मापती है जो किसी स्थूल ऊष्मागतिक अवस्था के अनुरूप होती हैं: S = k_B ln(Ω), जहाँ k_B बोल्ट्ज़मान नियतांक है। विलगित निकाय (isolated systems) स्वाभाविक रूप से उच्चतम Ω वाली अवस्थाओं की ओर बढ़ते हैं क्योंकि उनकी संभावना सबसे अधिक होती है।',
          hinglish:
            'Statistical mechanics mein Entropy (S) measure karti hai ki ek macroscopic state ko kitne microscopic ways (microstates, Ω) mein arrange kiya ja sakta hai: S = k_B ln(Ω). Isolated systems naturally high Ω wale states ki taraf jaate hain kyunki mathematically unki probability sabse zyada hoti hai.',
        },
        explanations: {
          simple: {
            en: 'Entropy is not just vague "disorder"—it counts how many different ways atoms can arrange themselves to look the same from the outside. Nature moves toward arrangements that have the most possible combinations.',
            hi: 'एन्ट्रॉपी केवल "अव्यवस्था" नहीं है—यह गिनती है कि परमाणु अंदर से कितने अलग-अलग तरीकों से व्यवस्थित हो सकते हैं ताकि बाहर से एक जैसे दिखें। प्रकृति उन व्यवस्थाओं की ओर बढ़ती है जिनके सबसे अधिक संयोजन संभव हैं।',
            hinglish:
              'Entropy ko sirf "messiness" mat samjho—yeh count karti hai ki molecules kitne अलग-अलग combinations mein reh sakte hain. Jis state ke combinations (Ω) sabse zyada hote hain, system wahi state पकड़ लेता hai.',
          },
          detailed: {
            en: 'Consider 100 gas molecules in a container. Having all 100 molecules on the left half corresponds to only 1 macro-arrangement (Ω = 1, so ln(1) = 0). Having 50 on each side corresponds to roughly 10^29 microstates. Because random thermal motion explores microstates without bias, the system overwhelmingly occupies the 50-50 distribution.',
            hi: 'एक पात्र में 100 गैस अणुओं की कल्पना करें। सभी 100 अणुओं का बाएँ हिस्से में होना केवल 1 सूक्ष्म व्यवस्था (Ω = 1) है। दोनों तरफ 50-50 अणु होने के लगभग 10^29 तरीके हैं। इसलिए यादृच्छिक गति के कारण निकाय 50-50 वितरण में ही बना रहता है।',
            hinglish:
              'Imagine karo ek box mein 100 gas molecules hain. Saare 100 molecules left side par hona sirf 1 तरीका (Ω = 1) hai. Lekin 50 left aur 50 right hone ke ~10^29 combinations hain. Isliye system naturally 50-50 spread state mein rehta hai.',
          },
          exam: {
            en: `• Formula: S = k_B ln(Ω), where k_B = 1.38 × 10^-23 J·K^-1.
• If Ω = 1 (perfect crystal at 0 K), S = 0 (Third Law of Thermodynamics).
• Extensive Property: For two independent subsystems A and B, Ω_total = Ω_A · Ω_B, so S_total = S_A + S_B.`,
            hi: `• सूत्र: S = k_B ln(Ω), जहाँ k_B = 1.38 × 10^-23 J/K।
• यदि Ω = 1 (0 K पर आदर्श क्रिस्टल), तो S = 0 (ऊष्मागतिकी का तृतीय नियम)।
• योगात्मक गुण: Ω_total = Ω_A × Ω_B, अतः S_total = S_A + S_B।`,
            hinglish: `• Equation: S = k_B ln(Ω).
• At Ω = 1 (0 Kelvin pure crystal), S = 0 (Third Law).
• Logarithmic property: Multiply microstates (Ω_A · Ω_B) = Add entropies (S_A + S_B).`,
          },
        },
      },
      {
        id: 'sec-t2',
        pageRef: 'Page 8, Section 2.1',
        heading: 'Clausius Inequality & Irreversibility',
        originalText:
          'For any thermodynamic cycle, the Clausius inequality states that ∮ (δQ / T) ≤ 0, where equality holds strictly for reversible processes. Consequently, for an isolated system (δQ = 0), ΔS_universe = ΔS_system + ΔS_surroundings ≥ 0. Real-world processes with friction, unrestrained expansion, or finite temperature gradients are strictly irreversible (ΔS_universe > 0).',
        translations: {
          hi: 'किसी भी ऊष्मागतिक चक्र के लिए, क्लॉसियस असमिका कहती है कि ∮ (δQ / T) ≤ 0, जहाँ समानता केवल उत्क्रमणीय (reversible) प्रक्रियाओं के लिए लागू होती है। इसलिए, एक विलगित निकाय के लिए ΔS_universe ≥ 0 होता है। घर्षण या मुक्त प्रसार वाली वास्तविक प्रक्रियाएँ अनुत्क्रमणीय (ΔS_universe > 0) होती हैं।',
          hinglish:
            'Kisi bhi thermodynamic cycle ke liye Clausius inequality kehti hai: ∮ (δQ / T) ≤ 0. Equality (= 0) sirf ideal reversible processes mein hoti hai. Real world mein friction aur heat loss ke kaaran har process irreversible hota hai, jisse ΔS_universe > 0 rehta hai.',
        },
        explanations: {
          simple: {
            en: 'Whenever energy moves in the real world—like heat flowing from a hot cup of tea into a cool room—some useful energy spreads out permanently, increasing total entropy.',
            hi: 'जब भी वास्तविक दुनिया में ऊर्जा का प्रवाह होता है—जैसे गर्म चाय के कप से ठंडे कमरे में ऊष्मा जाना—तो कुल एन्ट्रॉपी हमेशा बढ़ती है और वह प्रक्रिया अपने आप उल्टी नहीं होती।',
            hinglish:
              'Real world mein jab bhi heat transfer ya work hota hai (jaise garam chai ka thanda hona), toh total entropy hamesha badhti hai. Bina external work ke chai wapas apne aap garam nahi ho sakti.',
          },
          detailed: {
            en: 'If heat Q flows spontaneously from a hot reservoir at T_H to a cold reservoir at T_C (where T_H > T_C), the entropy change is ΔS = -Q/T_H + Q/T_C. Since 1/T_C > 1/T_H, ΔS is strictly positive, proving that spontaneous heat transfer across a finite temperature difference is thermodynamically irreversible.',
            hi: 'यदि ऊष्मा Q उच्च तापमान T_H से निम्न तापमान T_C की ओर प्रवाहित होती है, तो कुल एन्ट्रॉपी परिवर्तन ΔS = -Q/T_H + Q/T_C होता है। चूँकि T_H > T_C है, इसलिए ΔS हमेशा धनात्मक (+ve) होता है।',
            hinglish:
              'Agar heat Q hot body (T_H) se cold body (T_C) mein jaati hai, toh ΔS_total = -Q/T_H + Q/T_C. Kyunki T_C chhota hai, +Q/T_C bada hoga, isliye net ΔS hamesha positive aata hai.',
          },
          exam: {
            en: `• ΔS_univ = 0 → Reversible process (quasi-static, no dissipative forces).
• ΔS_univ > 0 → Irreversible / Spontaneous real-world process.
• ΔS_univ < 0 → Physically impossible for an isolated system.`,
            hi: `• ΔS_univ = 0 → उत्क्रमणीय (Reversible) प्रक्रिया।
• ΔS_univ > 0 → वास्तविक / स्वतःप्रवर्तित (Irreversible) प्रक्रिया।
• ΔS_univ < 0 → विलगित निकाय के लिए असंभव।`,
            hinglish: `• ΔS_univ = 0 → Ideal Reversible.
• ΔS_univ > 0 → Real Irreversible / Spontaneous.
• ΔS_univ < 0 → Impossible in an isolated system.`,
          },
        },
      },
    ],
  },
  {
    id: 'doc-algorithms',
    title: 'Dynamic Programming & Optimal Substructure in Graph Shortest Paths',
    author: 'Prof. Vikramaditya Rao — CS-301 Algorithm Design Handbook',
    category: 'Computer Science',
    pages: 9,
    estimatedMinutes: 12,
    dateAdded: '2025-02-14',
    sourceType: 'Built-in Verified Sample',
    summary:
      'Examines why greedy edge relaxation succeeds in non-negative weighted graphs (Dijkstra) while negative edge weights require Bellman-Ford dynamic programming.',
    sections: [
      {
        id: 'sec-a1',
        pageRef: 'Page 4, Section 3.1',
        heading: 'Optimal Substructure & Overlapping Subproblems',
        originalText:
          'A problem exhibits optimal substructure if an optimal solution to the global problem contains within it optimal solutions to subproblems. In shortest-path routing, any subpath of a shortest path between vertices u and v is itself a shortest path. Dynamic programming exploits this by memoizing or tabulating subproblem costs rather than recomputing exponential recursion trees.',
        translations: {
          hi: 'किसी समस्या में "इष्टतम उप-संरचना" (Optimal Substructure) तब होती है जब वैश्विक समस्या के सर्वोत्तम समाधान में उप-समस्याओं के सर्वोत्तम समाधान समाहित हों। सबसे छोटे पथ (Shortest Path) की समस्या में, दो शीर्षों u और v के बीच के सबसे छोटे रास्ते का कोई भी उप-भाग स्वयं भी सबसे छोटा रास्ता होता है।',
          hinglish:
            'Kisi problem mein "Optimal Substructure" tab hota hai jab main problem ke best solution ke andar subproblems ke bhi best solutions chhupe hon. Agar city A se C ka shortest rasta B se hokar jaata hai, toh A se B ka hissa bhi A se B ka shortest path hi hoga.',
        },
        explanations: {
          simple: {
            en: 'If the fastest driving route from Delhi to Mumbai passes through Jaipur, then the Delhi-to-Jaipur part of that trip must also be the fastest route between Delhi and Jaipur.',
            hi: 'यदि दिल्ली से मुंबई जाने का सबसे तेज़ रास्ता जयपुर से होकर गुज़रता है, तो उस यात्रा का दिल्ली-से-जयपुर वाला हिस्सा भी दिल्ली और जयपुर के बीच का सबसे तेज़ रास्ता ही होना चाहिए।',
            hinglish:
              'Agar Delhi se Mumbai ka shortest route Jaipur hokar jaata hai, toh us route ka Delhi-to-Jaipur part bhi automatically Delhi se Jaipur ka shortest route hi hoga.',
          },
          detailed: {
            en: 'Proof by contradiction (cut-and-paste argument): Suppose path p from u to v via intermediate vertex w is optimal, but the subpath p_uw is not the shortest path from u to w. Then we could replace p_uw with a strictly shorter path p_prime_uw, reducing the total weight of p—contradicting the optimality of p. Note: Longest simple path lacks this property due to vertex-disjointness constraints.',
            hi: 'विरोधाभास द्वारा प्रमाण: मान लीजिए u से v का इष्टतम पथ w से होकर जाता है, लेकिन u से w का उप-पथ सबसे छोटा नहीं है। तब हम उसे और छोटे पथ से बदलकर कुल दूरी कम कर सकते हैं, जो प्रारंभिक धारणा का खंडन करता है।',
            hinglish:
              'Cut-and-paste proof: Maan lo u se v via w shortest path hai, par u-to-w हिस्सा shortest nahi hai. Toh hum u-to-w ko ek aur chhote raste se replace karke total path aur chhota kar sakte hain—jo contradiction hai.',
          },
          exam: {
            en: `• Two pillars of DP: (1) Optimal Substructure, (2) Overlapping Subproblems.
• Shortest Simple Path: Has optimal substructure.
• Longest Simple Path: Does NOT have optimal substructure (NP-hard).`,
            hi: `• डायनामिक प्रोग्रामिंग के दो स्तंभ: (1) इष्टतम उप-संरचना, (2) ओवरलैपिंग उप-समस्याएँ।
• सबसे छोटा सरल पथ: इष्टतम उप-संरचना रखता है।
• सबसे लंबा सरल पथ: इष्टतम उप-संरचना नहीं रखता (NP-Hard)।`,
            hinglish: `• 2 Core Conditions of DP: Optimal Substructure + Overlapping Subproblems.
• Shortest Simple Path = DP/Greedy works.
• Longest Simple Path = No optimal substructure (NP-Hard).`,
          },
        },
      },
      {
        id: 'sec-a2',
        pageRef: 'Page 6, Section 3.4',
        heading: 'Dijkstra Greedy Invariant vs. Bellman-Ford Relaxation',
        originalText:
          'Dijkstra’s algorithm maintains a priority queue of tentative distances and greedily finalizes the closest unvisited vertex u, assuming all edge weights w(u,v) ≥ 0. When negative weights exist, a later path via a negative edge can reduce the cost to an already finalized vertex. Bellman-Ford resolves this by relaxing all |E| edges across |V| - 1 iterations in O(|V|·|E|) time.',
        translations: {
          hi: 'डाइक्स्ट्रा (Dijkstra) का एल्गोरिदम यह मानकर सबसे नज़दीकी अपरीक्षित शीर्ष u को अंतिम रूप देता है कि सभी किनारों का भार w(u,v) ≥ 0 है। जब ऋणात्मक भार मौजूद होते हैं, तो बाद में मिलने वाला ऋणात्मक किनारा पहले से तय किए गए शीर्ष की दूरी को और कम कर सकता है। बेलमैन-फोर्ड |V| - 1 चरणों में सभी |E| किनारों को शिथिल (relax) करके इसे हल करता है।',
          hinglish:
            'Dijkstra algorithm assume karta hai ki saare edge weights positive (≥ 0) hain, isliye woh closest node ko permanently lock kar deta hai. Lekin negative weight hone par baad mein koi rasta cost ko aur kam kar sakta hai. Bellman-Ford |V| - 1 rounds tak saare |E| edges ko relax karke isse handle karta hai.',
        },
        explanations: {
          simple: {
            en: 'Dijkstra takes shortcuts assuming roads only add travel time. If a road can somehow subtract time (negative weight), Dijkstra locks in its answer too early, whereas Bellman-Ford double-checks every connection.',
            hi: 'डाइक्स्ट्रा यह मानकर चलता है कि हर सड़क यात्रा का समय बढ़ाती ही है। यदि कोई सड़क समय घटा सकती है (ऋणात्मक भार), तो डाइक्स्ट्रा बहुत जल्दी गलत उत्तर लॉक कर लेता है, जबकि बेलमैन-फोर्ड हर रास्ते की दोबारा जाँच करता है।',
            hinglish:
              'Dijkstra maan ke chalta hai ki aage chalne par distance hamesha badheगा. Agar koi negative edge distance kam kar de, toh Dijkstra fail ho jata hai. Bellman-Ford har edge ko |V|-1 baar check karke sahi answer nikalta hai.',
          },
          detailed: {
            en: 'Any simple shortest path in a graph with |V| vertices contains at most |V| - 1 edges. By relaxing every edge in E during each of the |V| - 1 passes, Bellman-Ford inductively guarantees that after pass i, all shortest paths containing at most i edges have been discovered. A |V|-th pass detects reachable negative-weight cycles.',
            hi: '|V| शीर्षों वाले ग्राफ में किसी भी सरल पथ में अधिकतम |V| - 1 किनारे हो सकते हैं। इसलिए |V| - 1 बार सभी किनारों को रिलैक्स करने से सही न्यूनतम दूरी मिल जाती है। |V|-वाँ चरण ऋणात्मक चक्र (Negative Cycle) का पता लगाता है।',
            hinglish:
              '|V| vertices wale graph mein bina loop ke kisi bhi path mein max |V| - 1 edges ho sakte hain. Bellman-Ford |V| - 1 passes चलाता hai, aur |V|-th pass mein agar distance abhi bhi kam ho raha ho, toh Negative Cycle detect ho jati hai.',
          },
          exam: {
            en: `• Dijkstra Time Complexity: O((|V| + |E|) log |V|) with binary heap; fails on negative edges.
• Bellman-Ford Time Complexity: O(|V| · |E|); handles negative edges and detects negative cycles on pass |V|.`,
            hi: `• डाइक्स्ट्रा समय जटिलता: O((|V| + |E|) log |V|); ऋणात्मक भार पर विफल।
• बेलमैन-फोर्ड समय जटिलता: O(|V| · |E|); ऋणात्मक भार और ऋणात्मक चक्र दोनों को संभालता है।`,
            hinglish: `• Dijkstra: O((|V| + |E|) log |V|), requires w(u,v) ≥ 0.
• Bellman-Ford: O(|V| · |E|), works with negative weights & detects negative cycles.`,
          },
        },
      },
    ],
  },
];

export const CROSS_SOURCE_QA_BANK = [
  {
    id: 'qa-1',
    question: 'How do irrevocable rules or irreversible states appear across Constitutional Law and Thermodynamics?',
    requiredDocs: ['doc-constitution', 'doc-thermodynamics'],
    answer:
      'Both texts examine how systems transition from rigid or isolated states toward broader, irreversible equilibria—though in distinct domains. In Constitutional Law, the Supreme Court moved from treating Fundamental Rights as isolated "watertight compartments" in A.K. Gopalan (1950) to an integrated "Golden Triangle" (Articles 14, 19, and 21) in Maneka Gandhi (1978). In Thermodynamics, the Second Law and Clausius Inequality show that isolated physical systems naturally evolve toward macrostates with higher microstate multiplicity (Ω), where real-world processes with finite gradients are strictly irreversible (ΔS_universe > 0).',
    citations: [
      {
        docId: 'doc-constitution',
        docTitle: 'Constitutional Foundations: Article 21 & Due Process in India',
        reference: 'Page 2, Section 1.1 & Page 7, Section 2.4',
        excerpt:
          '"In Maneka Gandhi v. Union of India (1978), the Supreme Court abandoned the isolated reading of Fundamental Rights... Articles 14, 19, and 21 form an integrated Golden Triangle."',
      },
      {
        docId: 'doc-thermodynamics',
        docTitle: 'Entropy, Microstates & The Second Law of Thermodynamics',
        reference: 'Page 3, Section 1.2 & Page 8, Section 2.1',
        excerpt:
          '"Isolated systems evolve toward macrostates with the highest multiplicity Ω... Real-world processes with friction, unrestrained expansion, or finite temperature gradients are strictly irreversible (ΔS_universe > 0)."',
      },
    ],
  },
  {
    id: 'qa-2',
    question: 'Why did the Supreme Court replace the A.K. Gopalan interpretation in Maneka Gandhi?',
    requiredDocs: ['doc-constitution'],
    answer:
      'In A.K. Gopalan (1950), the Court read "procedure established by law" literally, holding that any statutorily enacted procedure was valid and that Fundamental Rights operated in separate compartments. In Maneka Gandhi (1978), the Court recognized that an arbitrary procedure is no procedure at all—ruling that any law depriving personal liberty under Article 21 must also pass the non-arbitrariness test of Article 14 and the reasonableness test of Article 19.',
    citations: [
      {
        docId: 'doc-constitution',
        docTitle: 'Constitutional Foundations: Article 21 & Due Process in India',
        reference: 'Page 7, Section 2.4',
        excerpt:
          '"It ruled that any procedure depriving a person of personal liberty must not be arbitrary, unfair, or unreasonable. Consequently, Articles 14, 19, and 21 form an integrated Golden Triangle."',
      },
    ],
  },
  {
    id: 'qa-3',
    question: 'Why does Dijkstra’s algorithm fail on negative edge weights while Bellman-Ford succeeds?',
    requiredDocs: ['doc-algorithms'],
    answer:
      'Dijkstra’s algorithm greedily locks in the shortest distance to the closest unvisited vertex under the assumption that adding edges can never reduce path cost (w(u,v) ≥ 0). If a negative weight exists downstream, a later path can undercut a vertex that Dijkstra already finalized. Bellman-Ford avoids this premature commitment by iteratively relaxing all |E| edges across |V| - 1 passes.',
    citations: [
      {
        docId: 'doc-algorithms',
        docTitle: 'Dynamic Programming & Optimal Substructure in Graph Shortest Paths',
        reference: 'Page 6, Section 3.4',
        excerpt:
          '"When negative weights exist, a later path via a negative edge can reduce the cost to an already finalized vertex. Bellman-Ford resolves this by relaxing all |E| edges across |V| - 1 iterations."',
      },
    ],
  },
  {
    id: 'qa-4',
    question: 'How do mathematical optimization in algorithms and statistical probability in physics evaluate system states?',
    requiredDocs: ['doc-thermodynamics', 'doc-algorithms'],
    answer:
      'In statistical physics, a macroscopic state is governed by combinatorial multiplicity (Ω) via S = k_B ln(Ω); isolated systems occupy the macrostate with the largest number of compatible microstates. In algorithmic dynamic programming, global optimization relies on optimal substructure—evaluating and tabulating intermediate subproblem states (such as edge relaxations over |V| - 1 passes) to guarantee the minimum-cost state without exhaustive exponential search.',
    citations: [
      {
        docId: 'doc-thermodynamics',
        docTitle: 'Entropy, Microstates & The Second Law of Thermodynamics',
        reference: 'Page 3, Section 1.2',
        excerpt:
          '"Entropy (S) measures the number of microscopic configurations (microstates, Ω) consistent with a macroscopic thermodynamic state: S = k_B ln(Ω)."',
      },
      {
        docId: 'doc-algorithms',
        docTitle: 'Dynamic Programming & Optimal Substructure in Graph Shortest Paths',
        reference: 'Page 4, Section 3.1',
        excerpt:
          '"A problem exhibits optimal substructure if an optimal solution to the global problem contains within it optimal solutions to subproblems."',
      },
    ],
  },
];

export const INITIAL_STUDY_TASKS = [
  {
    id: 'task-1',
    title: 'Compare A.K. Gopalan (1950) vs. Maneka Gandhi (1978) in Hindi & English notes',
    docId: 'doc-constitution',
    goalTag: 'Constitutional Law Exam Prep',
    dueDate: 'Today',
    completed: true,
    isIllustrativeTemplate: true,
  },
  {
    id: 'task-2',
    title: 'Derive Clausius Inequality and review Boltzmann microstate formula S = k_B ln(Ω)',
    docId: 'doc-thermodynamics',
    goalTag: 'Thermodynamics Problem Set',
    dueDate: 'Tomorrow',
    completed: false,
    isIllustrativeTemplate: true,
  },
  {
    id: 'task-3',
    title: 'Write dry-run trace showing why Dijkstra fails on a 4-node negative edge graph',
    docId: 'doc-algorithms',
    goalTag: 'CS-301 Mid-Sem Review',
    dueDate: 'In 2 days',
    completed: false,
    isIllustrativeTemplate: true,
  },
];
