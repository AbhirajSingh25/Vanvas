"""
VANVAS Destination Aliases & Canonical Mapping Registry
Authoritative mapping of common colloquial names, spiritual titles,
spelling variants, and regional landmarks to canonical destination slugs.
"""

from typing import Dict, Optional, Tuple, List, Any

# Primary colloquial & alternative spelling alias dictionary
DESTINATION_ALIASES: Dict[str, str] = {
    # 1. Varanasi / Banaras / Kashi
    "banaras": "varanasi",
    "benaras": "varanasi",
    "benares": "varanasi",
    "kashi": "varanasi",
    "kasi": "varanasi",
    "varanasi": "varanasi",
    "varansi": "varanasi",
    "varnasi": "varanasi",
    "assi ghat": "varanasi",
    "dashashwamedh": "varanasi",
    "kashi vishwanath": "varanasi",

    # 2. Tungnath–Chandrashila (Chopta)
    "chopta": "tungnath-chandrashila",
    "tungnath": "tungnath-chandrashila",
    "chandrashila": "tungnath-chandrashila",
    "deoria tal": "tungnath-chandrashila",
    "deoriatal": "tungnath-chandrashila",
    "mini switzerland": "tungnath-chandrashila",
    "ukhimath": "tungnath-chandrashila",
    "sari village": "tungnath-chandrashila",
    "sari base": "tungnath-chandrashila",
    "dugalbitta": "tungnath-chandrashila",

    # 3. Kainchi Dham
    "kainchi": "kainchi-dham",
    "kainchi dham": "kainchi-dham",
    "neem karoli": "kainchi-dham",
    "neem karoli baba": "kainchi-dham",
    "bhowali": "kainchi-dham",
    "bhimtal": "kainchi-dham",
    "sattal": "kainchi-dham",
    "naukuchiatal": "kainchi-dham",
    "ghorakhal": "kainchi-dham",

    # 4. Dharamshala & McLeod Ganj
    "dharamshala": "dharamshala",
    "dharamsala": "dharamshala",
    "mcleodganj": "dharamshala",
    "mcleod ganj": "dharamshala",
    "mcleod": "dharamshala",
    "bhagsunag": "dharamshala",
    "bhagsu": "dharamshala",
    "dharamkot": "dharamshala",
    "kangra": "dharamshala",

    # 5. Kasol & Parvati Valley
    "kasol": "kasol",
    "parvati valley": "kasol",
    "parvati": "kasol",
    "tosh": "kasol",
    "malana": "kasol",
    "kheerganga": "kasol",
    "chalal": "kasol",
    "manikaran": "kasol",

    # 6. Spiti Valley
    "spiti": "spiti",
    "spiti valley": "spiti",
    "kaza": "spiti",
    "tabo": "spiti",
    "key monastery": "spiti",
    "dhankar": "spiti",
    "chandratal": "spiti",
    "kibber": "spiti",
    "hikkim": "spiti",
    "langza": "spiti",

    # 7. Leh & Ladakh
    "leh": "leh",
    "ladakh": "leh",
    "pangong": "leh",
    "pangong tso": "leh",
    "nubra": "leh",
    "nubra valley": "leh",
    "khardung la": "leh",
    "zanskar": "leh",

    # 8. Manali
    "manali": "manali",
    "old manali": "manali",
    "solang": "manali",
    "solang valley": "manali",
    "rohtang": "manali",
    "sethan": "manali",
    "atal tunnel": "manali",

    # 9. Rishikesh
    "rishikesh": "rishikesh",
    "tapovan": "rishikesh",
    "laxman jhula": "rishikesh",
    "lakshman jhula": "rishikesh",
    "ram jhula": "rishikesh",
    "shivpuri": "rishikesh",
    "neelkanth": "rishikesh",

    # 10. Haridwar & Rishikesh
    "haridwar": "haridwar-rishikesh",
    "hardwar": "haridwar-rishikesh",
    "har ki pauri": "haridwar-rishikesh",

    # 11. Mussoorie
    "mussoorie": "mussoorie",
    "mussorie": "mussoorie",
    "landour": "mussoorie",
    "dhanaulti": "mussoorie",
    "kempty": "mussoorie",

    # 12. Jaipur
    "jaipur": "jaipur",
    "pink city": "jaipur",
    "hawa mahal": "jaipur",
    "amer": "jaipur",
    "nahargarh": "jaipur",

    # 13. Udaipur
    "udaipur": "udaipur",
    "city of lakes": "udaipur",
    "lake pichola": "udaipur",
    "fateh sagar": "udaipur",

    # 14. Jaisalmer
    "jaisalmer": "jaisalmer",
    "golden city": "jaisalmer",
    "sam sand dunes": "jaisalmer",
    "thar": "jaisalmer",

    # 15. Agra
    "agra": "agra",
    "taj mahal": "agra",
    "taj": "agra",
    "fatehpur sikri": "agra",

    # 16. Amritsar
    "amritsar": "amritsar",
    "golden temple": "amritsar",
    "harmandir sahib": "amritsar",
    "wagah": "amritsar",

    # 17. Mathura & Vrindavan
    "mathura": "mathura-vrindavan",
    "vrindavan": "mathura-vrindavan",
    "brindavan": "mathura-vrindavan",
    "braj": "mathura-vrindavan",
    "barsana": "mathura-vrindavan",
    "govardhan": "mathura-vrindavan",

    # 18. Delhi NCR
    "delhi": "delhi",
    "new delhi": "delhi",
    "dilli": "delhi",
    "ncr": "delhi",
    "gurgaon": "delhi",
    "gurugram": "delhi",
    "noida": "delhi",

    # 19. Mumbai
    "mumbai": "mumbai",
    "bombay": "mumbai",
    "bandra": "mumbai",
    "colaba": "mumbai",

    # 20. Bengaluru
    "bengaluru": "bengaluru",
    "bangalore": "bengaluru",

    # 21. Kolkata
    "kolkata": "kolkata",
    "calcutta": "kolkata",

    # 22. Pune
    "pune": "pune",
    "poona": "pune",

    # 23. Goa
    "goa": "goa",
    "panjim": "goa",
    "panaji": "goa",
    "north goa": "goa",
    "south goa": "goa",
    "calangute": "goa",
    "anjuna": "goa",
    "palolem": "goa",

    # 24. Munnar
    "munnar": "munnar",
    "idukki": "munnar",

    # 25. Dehradun
    "dehradun": "dehradun",
    "doon": "dehradun",

    # 26. Chandigarh
    "chandigarh": "chandigarh",

    # 27. Morni Hills
    "morni": "morni-hills",
    "morni hills": "morni-hills",

    # 28. Lansdowne
    "lansdowne": "lansdowne",

    # 29. Neemrana
    "neemrana": "neemrana",

    # 30. Damdama & Sohna
    "damdama": "damdama-sohna",
    "sohna": "damdama-sohna",
    "damdama lake": "damdama-sohna",

    # 31. Alwar & Siliserh
    "alwar": "alwar-siliserh",
    "siliserh": "alwar-siliserh",

    # 32. Sariska & Bhangarh
    "sariska": "sariska-bhangarh",
    "bhangarh": "sariska-bhangarh",

    # 33. Murthal
    "murthal": "murthal",

    # Popular Indian regions
    "kochi": "kochi",
    "cochin": "kochi",
    "alleppey": "alappuzha",
    "alappuzha": "alappuzha",
    "varkala": "varkala",
    "wayanad": "wayanad",
    "ooty": "ooty",
    "udhagamandalam": "ooty",
    "nilgiris": "ooty",
    "coorg": "coorg",
    "kodagu": "coorg",
    "hampi": "hampi",
    "gokarna": "gokarna",
    "pondicherry": "puducherry",
    "puducherry": "puducherry",
    "chennai": "chennai",
    "madras": "chennai",
    "hyderabad": "hyderabad",
    "shimla": "shimla",
    "jibhi": "jibhi",
    "tirthan": "tirthan",
    "bir": "bir",
    "bir billing": "bir",
    "nainital": "nainital",
    "auli": "auli",
    "gangtok": "gangtok",
    "sikkim": "gangtok",
    "darjeeling": "darjeeling",
    "shillong": "shillong",
    "meghalaya": "shillong"
}

def resolve_alias_to_slug(query: str) -> Optional[Tuple[str, str]]:
    """
    Given a query, checks exact or prefix alias match.
    Returns (canonical_slug, matched_alias_display) or None.
    """
    clean = (query or "").strip().lower()
    if not clean:
        return None

    # 1. Exact match in alias dict
    if clean in DESTINATION_ALIASES:
        target_slug = DESTINATION_ALIASES[clean]
        return target_slug, clean.title()

    # 2. Prefix match in alias keys (if query length >= 3)
    if len(clean) >= 3:
        for alias_key, target_slug in DESTINATION_ALIASES.items():
            if alias_key.startswith(clean):
                return target_slug, alias_key.title()

    # 3. Substring match for longer queries (length >= 4)
    if len(clean) >= 4:
        for alias_key, target_slug in DESTINATION_ALIASES.items():
            if clean in alias_key:
                return target_slug, alias_key.title()

    return None
