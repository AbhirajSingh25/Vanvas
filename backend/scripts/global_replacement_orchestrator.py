import os
import sys
import json
import re
import math
import hashlib
import random
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageOps

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"
PUBLIC_DIR = FRONTEND_DIR / "public"
BRAIN_DIR = Path(r"C:\Users\user\.gemini\antigravity-ide\brain")

DESTINATION_ORDER = [
    # Batch 1
    "goa", "jaipur", "udaipur",
    # Batch 2
    "varanasi", "leh", "spiti",
    # Batch 3
    "mussoorie", "rishikesh", "manali",
    # Batch 4
    "dharamshala", "kasol", "jaisalmer",
    # Batch 5
    "munnar", "dehradun", "tungnath-chandrashila",
    # Batch 6
    "kainchi-dham", "agra", "mathura-vrindavan",
    # Batch 7
    "neemrana", "damdama-sohna", "alwar-siliserh",
    # Batch 8
    "sariska-bhangarh", "chandigarh", "morni-hills", "lansdowne", "murthal"
]

# Curated Brain matches from previous high-quality generation passes
BRAIN_ARTWORK_MAP = {
    # Manali
    "place-manali-hadimba-temple": "9935f763-197b-430e-ba3d-c3fe27147ddd/hadimba_temple_test_1790679925601.jpg",
    "place-manali-jogini-waterfall": "9935f763-197b-430e-ba3d-c3fe27147ddd/jogini_waterfall_manali_1790680278031.jpg",
    "place-manali-solang-valley": "9935f763-197b-430e-ba3d-c3fe27147ddd/solang_valley_manali_1790680340848.jpg",
    "place-manali-vashisht-springs": "9935f763-197b-430e-ba3d-c3fe27147ddd/vashisht_temple_manali_1790680407244.jpg",
    "place-manali-old-manali-village": "9935f763-197b-430e-ba3d-c3fe27147ddd/old_manali_manu_temple_1790680461969.jpg",
    "hotel-manali-the-himalayan-castle-and-stone-cottages": "9935f763-197b-430e-ba3d-c3fe27147ddd/the_himalayan_castle_manali_1790680516336.jpg",
    "hotel-manali-larisa-resort-and-apple-orchard": "9935f763-197b-430e-ba3d-c3fe27147ddd/larisa_resort_manali_1790680562512.jpg",
    "hotel-manali-drifters-inn-and-wooden-loft": "9935f763-197b-430e-ba3d-c3fe27147ddd/drifters_inn_manali_1790680621107.jpg",
    "hotel-manali-zostel-manali-old-manali": "9935f763-197b-430e-ba3d-c3fe27147ddd/zostel_manali_stay_1790680687784.jpg",
    "rental-manali-honda-activa-6g-beas-valley-edition": "9935f763-197b-430e-ba3d-c3fe27147ddd/manali_beas_activa_1790680772882.jpg",
    "rental-manali-royal-enfield-classic-350-solang-tourer": "9935f763-197b-430e-ba3d-c3fe27147ddd/manali_solang_bullet_1790680850983.jpg",
    "rental-manali-royal-enfield-himalayan-450-adventure": "9e60f622-4662-4296-af22-ec80b3e32034/manali_himalayan_adv_1790660863441.jpg",
    
    # Rishikesh
    "place-rishikesh-beatles-ashram": "9e60f622-4662-4296-af22-ec80b3e32034/rishikesh_beatles_ashram_1790661105595.jpg",
    "place-rishikesh-neer-garh-waterfall": "9e60f622-4662-4296-af22-ec80b3e32034/rishikesh_neer_garh_1790661139197.jpg",
    "place-rishikesh-parmarth-niketan-aarti": "9e60f622-4662-4296-af22-ec80b3e32034/rishikesh_parmarth_niketan_1790661079636.jpg",
    "place-rishikesh-shivpuri-river-rafting": "9e60f622-4662-4296-af22-ec80b3e32034/rishikesh_shivpuri_rafting_1790661191281.jpg",
    "place-rishikesh-triveni-ghat-aarti": "9e60f622-4662-4296-af22-ec80b3e32034/rishikesh_triveni_ghat_1790661227435.jpg",
    "rental-rishikesh-trek-marlin-mountain-bike-mtb": "9e60f622-4662-4296-af22-ec80b3e32034/rishikesh_ganga_mtb_1790660896070.jpg",
    "hotel-rishikesh-ganga-kinare-riverside-sanctuary": "56d14936-097a-4183-b6d4-eea57379da41/rishikesh_riverside_stay_1790087104761.jpg",

    # Udaipur
    "place-udaipur-bagore-ki-haveli": "9e60f622-4662-4296-af22-ec80b3e32034/udaipur_bagore_ki_haveli_1790660943277.jpg",
    "place-udaipur-saheliyon-ki-bari": "9e60f622-4662-4296-af22-ec80b3e32034/udaipur_saheliyon_ki_bari_1790660970697.jpg",
    "place-udaipur-sajjangarh-monsoon-palace": "9e60f622-4662-4296-af22-ec80b3e32034/udaipur_sajjangarh_1790660994394.jpg",
    "place-udaipur-jeels-ginger-coffee": "9e60f622-4662-4296-af22-ec80b3e32034/udaipur_jeels_cafe_1790661023119.jpg",
    "place-udaipur-natraj-dining-hall": "9e60f622-4662-4296-af22-ec80b3e32034/udaipur_natraj_dining_1790661050494.jpg",
    "place-udaipur-city-palace": "679642f6-4950-4a64-b8e8-9cdf22d30326/city_palace_udaipur_1789721555420.jpg",
    "hotel-udaipur-taj-lake-palace-heritage-island": "56d14936-097a-4183-b6d4-eea57379da41/udaipur_heritage_stay_1790087075334.jpg",
    "rental-udaipur-honda-activa-6g-lake-city-explorer": "36e6abfe-1b0d-40b5-a5f3-6143a1b41e6c/udaipur_scooter_1790501699755.jpg",
    "rental-udaipur-royal-enfield-classic-350-mewar-cruiser": "36e6abfe-1b0d-40b5-a5f3-6143a1b41e6c/udaipur_bullet_1790501752989.jpg",
    "rental-udaipur-mahindra-thar-4x4-aravalli-safari": "36e6abfe-1b0d-40b5-a5f3-6143a1b41e6c/udaipur_car_1790501779202.jpg",

    # Jaisalmer
    "place-jaisalmer-jaisalmer-fort": "d0da514e-77f6-4399-9acd-d38d9ec069d0/jaisalmer_fort_1790589532201.jpg",
    "place-jaisalmer-patwon-ki-haveli": "d0da514e-77f6-4399-9acd-d38d9ec069d0/patwon_haveli_1790589574881.jpg",
    "place-jaisalmer-gadisar-lake": "d0da514e-77f6-4399-9acd-d38d9ec069d0/gadisar_lake_1790589549205.jpg",
    "place-jaisalmer-sam-sand-dunes": "d0da514e-77f6-4399-9acd-d38d9ec069d0/sam_sand_dunes_1790589597020.jpg",
    "place-jaisalmer-kuldhara-abandoned-village": "d0da514e-77f6-4399-9acd-d38d9ec069d0/kuldhara_village_1790589621908.jpg",
    "place-jaisalmer-jain-temples-fort": "d0da514e-77f6-4399-9acd-d38d9ec069d0/jain_temples_jaisalmer_1790589643253.jpg",
    "place-jaisalmer-salim-singh-ki-haveli": "d0da514e-77f6-4399-9acd-d38d9ec069d0/salim_singh_haveli_1790589672356.jpg",
    "place-jaisalmer-the-trio-rooftop": "d0da514e-77f6-4399-9acd-d38d9ec069d0/the_trio_jaisalmer_1790589705275.jpg",
    "hotel-jaisalmer-suryagarh-palace-desert-oasis": "d0da514e-77f6-4399-9acd-d38d9ec069d0/suryagarh_jaisalmer_1790589741699.jpg",
    "hotel-jaisalmer-killa-bhawan-heritage-bastion": "d0da514e-77f6-4399-9acd-d38d9ec069d0/killa_bhawan_jaisalmer_1790589772207.jpg",
    "hotel-jaisalmer-jaisalmer-marriott-resort-and-spa": "d0da514e-77f6-4399-9acd-d38d9ec069d0/marriott_jaisalmer_1790589804043.jpg",
    "hotel-jaisalmer-zostel-jaisalmer-haveli-hostel": "d0da514e-77f6-4399-9acd-d38d9ec069d0/zostel_jaisalmer_1790589846304.jpg",

    # Munnar
    "place-munnar-attukad-waterfalls": "fe33de26-202e-4c5b-9ab5-8b5df48b52be/attukal_waterfalls_1790101311305.jpg",
    "place-munnar-eravikulam-national-park": "fe33de26-202e-4c5b-9ab5-8b5df48b52be/eravikulam_national_park_1790101292404.jpg",
    "place-munnar-tata-tea-museum": "fe33de26-202e-4c5b-9ab5-8b5df48b52be/kolukkumalai_tea_estate_1790101226677.jpg",
    "place-munnar-mattupetty-dam-lake": "99de6974-f064-4207-8537-92e7c7bc3cf5/munnar_mattupetty_dam_1790005704791.jpg",
    "hotel-munnar-windermere-estate": "9935f763-197b-430e-ba3d-c3fe27147ddd/windermere_munnar_test_1790680068920.jpg",
    "rental-munnar-royal-enfield-himalayan-450-estate-rider": "9935f763-197b-430e-ba3d-c3fe27147ddd/munnar_himalayan_test_1790679982225.jpg",

    # Dharamshala
    "place-dharamshala-triund-trek-base": "99de6974-f064-4207-8537-92e7c7bc3cf5/dharamshala_triund_trek_1790005667915.jpg",
    "place-dharamshala-bhagsunag-waterfall": "64250292-2df2-4217-a06f-6878bca68160/bhagsunag_waterfall_1790160433224.jpg",
    "place-dharamshala-norbulingka-institute": "64250292-2df2-4217-a06f-6878bca68160/norbulingka_institute_1790160467453.jpg",
    "place-dharamshala-illiterati-cafe": "64250292-2df2-4217-a06f-6878bca68160/illiterati_cafe_1790160492085.jpg",
    "place-dharamshala-namgyal-monastery": "679642f6-4950-4a64-b8e8-9cdf22d30326/namgyal_monastery_dharamshala_1789721422529.jpg",

    # Kasol
    "place-kasol-tosh-village": "99de6974-f064-4207-8537-92e7c7bc3cf5/kasol_tosh_village_1790005466903.jpg",
    "place-kasol-evergreen-cafe": "99de6974-f064-4207-8537-92e7c7bc3cf5/kasol_evergreen_cafe_1790005503740.jpg",
    "place-kasol-chalal-trail": "7fab207c-56bd-4d69-a5b1-4e74ae8c3530/kasol_chalal_trail_1789970348406.jpg",
    "place-kasol-manikaran-sahib-gurudwara": "7fab207c-56bd-4d69-a5b1-4e74ae8c3530/kasol_manikaran_sahib_1789970395733.jpg",
    "place-kasol-kheerganga-trek": "7fab207c-56bd-4d69-a5b1-4e74ae8c3530/kasol_kheerganga_trail_1789970484727.jpg",
    "place-kasol-moon-dance-cafe": "7fab207c-56bd-4d69-a5b1-4e74ae8c3530/kasol_moon_dance_cafe_1789970295082.jpg",

    # Varanasi
    "hotel-varanasi-brijrama-palace-heritage-grand": "e3ba4f48-dc93-4e15-9ff3-fe520a5c8ca0/brijrama_palace_varanasi_1790165783584.jpg",
    "place-varanasi-kashi-vishwanath-corridor": "99de6974-f064-4207-8537-92e7c7bc3cf5/varanasi_kashi_vishwanath_1790005207872.jpg",
    "place-varanasi-assi-ghat-subah-e-banaras": "99de6974-f064-4207-8537-92e7c7bc3cf5/varanasi_assi_ghat_1790005412786.jpg",
    "place-varanasi-blue-lassi-shop": "99de6974-f064-4207-8537-92e7c7bc3cf5/varanasi_blue_lassi_1790005440839.jpg",
    "place-varanasi-dashashwamedh-ghat-evening-aarti": "679642f6-4950-4a64-b8e8-9cdf22d30326/dashashwamedh_ghat_varanasi_1789721593358.jpg",
    "rental-varanasi-honda-activa-6g-ghat-nav-edition": "36e6abfe-1b0d-40b5-a5f3-6143a1b41e6c/varanasi_scooter_1790501823722.jpg",
    "rental-varanasi-royal-enfield-bullet-350-ganga-cruiser": "36e6abfe-1b0d-40b5-a5f3-6143a1b41e6c/varanasi_bullet_1790501866247.jpg",
    "rental-varanasi-toyota-innova-crysta-spiritual-charter": "36e6abfe-1b0d-40b5-a5f3-6143a1b41e6c/varanasi_car_1790501902015.jpg",

    # Jaipur
    "place-jaipur-nahargarh-fort-sunset": "e3ba4f48-dc93-4e15-9ff3-fe520a5c8ca0/nahargarh_fort_jaipur_1790165761592.jpg",
    "place-jaipur-hawa-mahal": "679642f6-4950-4a64-b8e8-9cdf22d30326/hawa_mahal_jaipur_1789721703410.jpg",
    "rental-jaipur-honda-activa-6g-pink-city-edition": "36e6abfe-1b0d-40b5-a5f3-6143a1b41e6c/jaipur_scooter_1790501619597.jpg",
    "rental-jaipur-royal-enfield-classic-350-desert-cruiser": "36e6abfe-1b0d-40b5-a5f3-6143a1b41e6c/jaipur_bullet_1790501650201.jpg",
    "rental-jaipur-mahindra-thar-4x4-shekhawati-safari": "36e6abfe-1b0d-40b5-a5f3-6143a1b41e6c/jaipur_car_1790501670375.jpg",

    # Goa
    "place-goa-aguada-fort": "679642f6-4950-4a64-b8e8-9cdf22d30326/aguada_fort_goa_1789721467310.jpg",
    "place-goa-fontainhas-latin-quarter": "679642f6-4950-4a64-b8e8-9cdf22d30326/fontainhas_goa_heritage_1789721442827.jpg",
    "place-goa-anjuna-beach": "64250292-2df2-4217-a06f-6878bca68160/anjuna_beach_1790160553638.jpg",
    "rental-goa-honda-activa-6g-coastal-edition": "36e6abfe-1b0d-40b5-a5f3-6143a1b41e6c/goa_anjuna_scooter_1790501516632.jpg",
    "rental-goa-royal-enfield-classic-350-sunset-cruiser": "36e6abfe-1b0d-40b5-a5f3-6143a1b41e6c/goa_coastal_bullet_1790501546073.jpg",
    "rental-goa-mahindra-thar-4x4-convertible": "36e6abfe-1b0d-40b5-a5f3-6143a1b41e6c/goa_coastal_car_1790501578183.jpg",

    # Leh
    "place-leh-thiksey-monastery": "679642f6-4950-4a64-b8e8-9cdf22d30326/thiksey_monastery_leh_1789721620572.jpg",
    "rental-leh-royal-enfield-himalayan-450-pass-master": "36e6abfe-1b0d-40b5-a5f3-6143a1b41e6c/leh_palace_bullet_1790501937384.jpg",

    # Spiti
    "place-spiti-key-monastery-gompa": "7fab207c-56bd-4d69-a5b1-4e74ae8c3530/spiti_key_monastery_1789970016559.jpg",
    "place-spiti-chandratal-lake-moon-lake": "7fab207c-56bd-4d69-a5b1-4e74ae8c3530/spiti_chandratal_lake_1789970045011.jpg",
    "place-spiti-tabo-monastery-1000-year-heritage": "7fab207c-56bd-4d69-a5b1-4e74ae8c3530/spiti_tabo_monastery_1789970074742.jpg",
    "place-spiti-dhankar-gompa-and-cliff-fort": "7fab207c-56bd-4d69-a5b1-4e74ae8c3530/spiti_dhankar_gompa_1789970104834.jpg",
    "place-spiti-kaza-old-market-and-monastery": "7fab207c-56bd-4d69-a5b1-4e74ae8c3530/spiti_kaza_town_1789970141170.jpg",
    "place-spiti-taste-of-spiti-seabuckthorn-cafe": "7fab207c-56bd-4d69-a5b1-4e74ae8c3530/spiti_cafe_food_1789970172597.jpg",
    "hotel-spiti-norling-homestay-and-organic-kitchen": "7fab207c-56bd-4d69-a5b1-4e74ae8c3530/spiti_stay_homestay_1789970209254.jpg",

    # Mussoorie
    "place-mussoorie-landour-bakehouse": "324dcf2d-65c5-453e-be50-a475af91e00b/mussoorie_landour_bakehouse_1789573493120.jpg",
    "place-mussoorie-lal-tibba": "324dcf2d-65c5-453e-be50-a475af91e00b/mussoorie_lal_tibba_1789573513671.jpg",
    "place-mussoorie-kempty-falls": "324dcf2d-65c5-453e-be50-a475af91e00b/mussoorie_kempty_falls_1789573544308.jpg",
    "place-mussoorie-gun-hill": "324dcf2d-65c5-453e-be50-a475af91e00b/mussoorie_gun_hill_1789573567116.jpg",
    "place-mussoorie-camels-back-road": "324dcf2d-65c5-453e-be50-a475af91e00b/mussoorie_camel_back_1789573603642.jpg",
    "place-mussoorie-mall-road": "324dcf2d-65c5-453e-be50-a475af91e00b/mussoorie_mall_road_1789573632925.jpg",
    "place-mussoorie-george-everest": "324dcf2d-65c5-453e-be50-a475af91e00b/mussoorie_george_everest_1789573677349.jpg",
    "place-mussoorie-clouds-end": "324dcf2d-65c5-453e-be50-a475af91e00b/mussoorie_clouds_end_1789573740972.jpg",

    # Tungnath & Kainchi Dham
    "place-tungnath-chandrashila-rohida-forest-trail": "d0da514e-77f6-4399-9acd-d38d9ec069d0/tungnath_forest_trail_1790589887337.jpg",
    "place-tungnath-chandrashila-tungnath-temple": "4e49f664-c488-4c01-9082-c1551c8e686d/tungnath_temple_card_1790180638379.jpg",
    "place-kainchi-dham-neem-karoli-baba-ashram": "b0e6a200-96d9-4fbd-9057-c3a87cd6fa11/kainchi_dham_hero_1790265491286.jpg",
}

print(f"Loaded {len(BRAIN_ARTWORK_MAP)} verified brain artwork mappings.")
