"use client";
import React, { useState } from "react";
import Image from "next/image";

export type VehicleCategory =
  | "adventure_motorcycle"
  | "classic_bullet"
  | "automatic_scooter"
  | "electric_scooter"
  | "mountain_bike"
  | "car"
  | "universal_mobility";

export interface MobilityContext {
  destination?: string;
  state?: string;
  region?: string;
  terrain?: string;
}

interface VehicleArtworkProps {
  type?: string;
  name?: string;
  destination?: string;
  context?: MobilityContext;
  imageUrl?: string | null;
  alt?: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: "video" | "square" | "wide" | "fill";
  priority?: boolean;
  showBadge?: boolean;
}

interface ArtworkResult {
  src: string;
  label: string;
  category: VehicleCategory;
}

/**
 * Authoritative Canonical Destination Vehicle Registry.
 * Explicit deterministic mapping for all 26 VANVAS canonical destinations.
 */
const DESTINATION_VEHICLE_REGISTRY: Record<
  string,
  {
    scooter: ArtworkResult;
    motorcycle: ArtworkResult;
    adventure?: ArtworkResult;
    bicycle?: ArtworkResult;
    car?: ArtworkResult;
    default: ArtworkResult;
  }
> = {
  // 1. Goa
  goa: {
    scooter: {
      src: "/images/vehicles/goa_beach_scooter.jpg",
      label: "Anjuna Beach Palm Scooter",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/goa_coastal_bullet.jpg",
      label: "Goa Coastal Heritage Cruiser",
      category: "classic_bullet",
    },
    adventure: {
      src: "/images/vehicles/coastal_heritage_bike.jpg",
      label: "Goa Coastal Heritage Adventure Tourer",
      category: "adventure_motorcycle",
    },
    bicycle: {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Goan Trail Bicycle",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/goa_coastal_car.jpg",
      label: "Goa Coastal Self-Drive Car",
      category: "car",
    },
    default: {
      src: "/images/vehicles/goa_beach_scooter.jpg",
      label: "Goan Coastal Mobility",
      category: "automatic_scooter",
    },
  },

  // 2. Jaipur
  jaipur: {
    scooter: {
      src: "/images/vehicles/jaipur_hawa_mahal_scooter.jpg",
      label: "Hawa Mahal Pink City Scooter",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/jaipur_pinkcity_bullet.jpg",
      label: "Pink City Bazaar Cruiser",
      category: "classic_bullet",
    },
    adventure: {
      src: "/images/vehicles/rajasthan_desert_bike.jpg",
      label: "Aravalli Ridge Tourer",
      category: "adventure_motorcycle",
    },
    bicycle: {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Pink City Heritage Cycle",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/jaipur_amer_car.jpg",
      label: "Pink City Amer Heritage Car",
      category: "car",
    },
    default: {
      src: "/images/vehicles/jaipur_hawa_mahal_scooter.jpg",
      label: "Jaipur Heritage Mobility",
      category: "automatic_scooter",
    },
  },

  // 3. Udaipur
  udaipur: {
    scooter: {
      src: "/images/vehicles/udaipur_pichola_scooter.jpg",
      label: "Lake Pichola Waterfront Scooter",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/udaipur_oldcity_bullet.jpg",
      label: "Old City Mewar Heritage Cruiser",
      category: "classic_bullet",
    },
    adventure: {
      src: "/images/vehicles/rajasthan_desert_bike.jpg",
      label: "Mewar Aravalli Tourer",
      category: "adventure_motorcycle",
    },
    bicycle: {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Fateh Sagar Lakeside Cycle",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/udaipur_lakeside_car.jpg",
      label: "Lake Pichola Aravalli Car",
      category: "car",
    },
    default: {
      src: "/images/vehicles/udaipur_pichola_scooter.jpg",
      label: "Udaipur Lakeside Mobility",
      category: "automatic_scooter",
    },
  },

  // 4. Varanasi
  varanasi: {
    scooter: {
      src: "/images/vehicles/varanasi_assi_scooter.jpg",
      label: "Assi Ghat Morning Scooter",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/varanasi_bhu_bullet.jpg",
      label: "BHU Campus Heritage Cruiser",
      category: "classic_bullet",
    },
    adventure: {
      src: "/images/vehicles/adventure_motorcycle.jpg",
      label: "Kashi Expedition Adventure Tourer",
      category: "adventure_motorcycle",
    },
    bicycle: {
      src: "/images/vehicles/varanasi_city_cycle.jpg",
      label: "Ghat Approach Heritage Cycle",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/varanasi_ghat_car.jpg",
      label: "Kashi Ghat Approach Car",
      category: "car",
    },
    default: {
      src: "/images/vehicles/varanasi_assi_scooter.jpg",
      label: "Varanasi Ghat Approach Fleet",
      category: "automatic_scooter",
    },
  },

  // 5. Leh
  leh: {
    scooter: {
      src: "/images/vehicles/leh_palace_bullet.jpg",
      label: "Leh Town Mountain Scooter",
      category: "classic_bullet",
    },
    motorcycle: {
      src: "/images/vehicles/leh_palace_bullet.jpg",
      label: "Leh Palace High-Altitude Bullet",
      category: "classic_bullet",
    },
    adventure: {
      src: "/images/vehicles/leh_high_altitude_motorcycle.jpg",
      label: "Ladakh High-Altitude Adventure Tourer",
      category: "adventure_motorcycle",
    },
    bicycle: {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Indus Valley Mountain MTB",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/universal_mobility.jpg",
      label: "Ladakh 4x4 Expedition Taxi",
      category: "car",
    },
    default: {
      src: "/images/vehicles/leh_palace_bullet.jpg",
      label: "Leh Ladakh High-Altitude Fleet",
      category: "classic_bullet",
    },
  },

  // 6. Spiti
  spiti: {
    scooter: {
      src: "/images/vehicles/spiti_arid_adventure_bike.jpg",
      label: "Spiti Cold Desert Tourer",
      category: "adventure_motorcycle",
    },
    motorcycle: {
      src: "/images/vehicles/spiti_arid_adventure_bike.jpg",
      label: "Spiti Valley Arid Tourer",
      category: "adventure_motorcycle",
    },
    adventure: {
      src: "/images/vehicles/spiti_arid_adventure_bike.jpg",
      label: "Spiti Valley Arid Tourer",
      category: "adventure_motorcycle",
    },
    bicycle: {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Trans-Himalayan MTB",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/universal_mobility.jpg",
      label: "Spiti 4x4 Mountain Cruiser",
      category: "car",
    },
    default: {
      src: "/images/vehicles/spiti_arid_adventure_bike.jpg",
      label: "Spiti Cold Desert Tourer",
      category: "adventure_motorcycle",
    },
  },

  // 7. Mussoorie / Landour (Dedicated Uttarakhand Ridge Artworks)
  mussoorie: {
    scooter: {
      src: "/images/vehicles/mussoorie_landour_scooter.jpg",
      label: "Landour Deodar Ridge Scooter",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/mussoorie_landour_bullet.jpg",
      label: "Mussoorie Mall Road Classic Bullet",
      category: "classic_bullet",
    },
    adventure: {
      src: "/images/vehicles/mussoorie_landour_bullet.jpg",
      label: "Mussoorie Camel's Back Cruiser",
      category: "classic_bullet",
    },
    bicycle: {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Landour Hill Loop MTB",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/mussoorie_hill_car.jpg",
      label: "Mussoorie Garhwal Hill Car",
      category: "car",
    },
    default: {
      src: "/images/vehicles/mussoorie_landour_scooter.jpg",
      label: "Mussoorie & Landour Ridge Fleet",
      category: "automatic_scooter",
    },
  },

  // 8. Rishikesh
  rishikesh: {
    scooter: {
      src: "/images/vehicles/rishikesh_tapovan_scooter.jpg",
      label: "Tapovan Ganga Foothill Scooter",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/rishikesh_ganga_bullet.jpg",
      label: "Rishikesh Ganga Cruiser",
      category: "classic_bullet",
    },
    adventure: {
      src: "/images/vehicles/rishikesh_ganga_bullet.jpg",
      label: "Garhwal Foothill Himalayan Cruiser",
      category: "classic_bullet",
    },
    bicycle: {
      src: "/images/vehicles/rishikesh_ganga_mtb.jpg",
      label: "Rishikesh Ganga Trail MTB",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/rishikesh_tapovan_scooter.jpg",
      label: "Rishikesh Foothills Mobility",
      category: "automatic_scooter",
    },
    default: {
      src: "/images/vehicles/rishikesh_tapovan_scooter.jpg",
      label: "Rishikesh Mobility Fleet",
      category: "automatic_scooter",
    },
  },

  // 9. Manali
  manali: {
    scooter: {
      src: "/images/vehicles/manali_beas_scooter.jpg",
      label: "Old Manali Beas Valley Scooter",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/manali_solang_bullet.jpg",
      label: "Manali Solang Pass Bullet",
      category: "classic_bullet",
    },
    adventure: {
      src: "/images/vehicles/manali_himalayan_adv_bike.jpg",
      label: "Manali Himalayan 450 Pass Tourer",
      category: "adventure_motorcycle",
    },
    bicycle: {
      src: "/images/vehicles/manali_solang_mtb.jpg",
      label: "Solang Downhill Mountain MTB",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/manali_solang_bullet.jpg",
      label: "Manali Mountain Mobility",
      category: "classic_bullet",
    },
    default: {
      src: "/images/vehicles/manali_beas_scooter.jpg",
      label: "Manali Valley Mobility Fleet",
      category: "automatic_scooter",
    },
  },

  // 10. Dharamshala / McLeod Ganj
  dharamshala: {
    scooter: {
      src: "/images/vehicles/dharamshala_mcleod_scooter.jpg",
      label: "McLeod Ganj Cedar Ridge Scooter",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/dharamshala_dhauladhar_bullet.jpg",
      label: "Dhauladhar Snow View Classic Bullet",
      category: "classic_bullet",
    },
    adventure: {
      src: "/images/vehicles/himachal_pine_forest_bike.jpg",
      label: "Dhauladhar Snow View Classic Bullet",
      category: "adventure_motorcycle",
    },
    bicycle: {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Dharamsala Pine Trail Cycle",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/universal_mobility.jpg",
      label: "Kangra Valley Taxi",
      category: "car",
    },
    default: {
      src: "/images/vehicles/dharamshala_mcleod_scooter.jpg",
      label: "Dharamshala & McLeod Ganj Fleet",
      category: "automatic_scooter",
    },
  },

  // 11. Kasol / Parvati Valley
  kasol: {
    scooter: {
      src: "/images/vehicles/kasol_valley_scooter.jpg",
      label: "Parvati Valley Pine Scooter",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/kasol_parvati_bullet.jpg",
      label: "Parvati Gorge Classic Cruiser",
      category: "classic_bullet",
    },
    adventure: {
      src: "/images/vehicles/himachal_pine_forest_bike.jpg",
      label: "Parvati Gorge Trail Tourer",
      category: "adventure_motorcycle",
    },
    bicycle: {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Parvati Riverside Trail Cycle",
      category: "mountain_bike",
    },
    default: {
      src: "/images/vehicles/kasol_valley_scooter.jpg",
      label: "Kasol Parvati Valley Mobility",
      category: "automatic_scooter",
    },
  },

  // 12. Jaisalmer
  jaisalmer: {
    scooter: {
      src: "/images/vehicles/jaisalmer_fort_scooter.jpg",
      label: "Golden Fort Sandstone Scooter",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/jaisalmer_thar_bullet.jpg",
      label: "Thar Desert Sandstone Cruiser",
      category: "classic_bullet",
    },
    adventure: {
      src: "/images/vehicles/rajasthan_desert_bike.jpg",
      label: "Thar Desert Safari Tourer",
      category: "adventure_motorcycle",
    },
    bicycle: {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Desert Fortress Cycle",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/universal_mobility.jpg",
      label: "Thar Desert 4x4 Safari SUV",
      category: "car",
    },
    default: {
      src: "/images/vehicles/jaisalmer_thar_bullet.jpg",
      label: "Jaisalmer Desert Mobility",
      category: "classic_bullet",
    },
  },

  // 13. Munnar
  munnar: {
    scooter: {
      src: "/images/vehicles/kerala_tea_plantation_scooter.jpg",
      label: "Munnar Tea Estate Cruiser Scooter",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/kerala_western_ghats_bike.jpg",
      label: "Western Ghats Misty Mountain Cruiser",
      category: "adventure_motorcycle",
    },
    adventure: {
      src: "/images/vehicles/kerala_western_ghats_bike.jpg",
      label: "Western Ghats Misty Tourer",
      category: "adventure_motorcycle",
    },
    bicycle: {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Tea Garden Trail MTB",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/universal_mobility.jpg",
      label: "Munnar Ghat Road Car",
      category: "car",
    },
    default: {
      src: "/images/vehicles/kerala_tea_plantation_scooter.jpg",
      label: "Munnar Plantation Mobility",
      category: "automatic_scooter",
    },
  },

  // 14. Dehradun
  dehradun: {
    scooter: {
      src: "/images/vehicles/dehradun_rajpur_scooter.jpg",
      label: "Rajpur Road Foothill Scooter",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/dehradun_foothills_bike.jpg",
      label: "Doon Valley Foothills Bullet",
      category: "classic_bullet",
    },
    adventure: {
      src: "/images/vehicles/uttarakhand_forest_bike.jpg",
      label: "Mussoorie Pass Tourer",
      category: "adventure_motorcycle",
    },
    bicycle: {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Doon Sal Forest Cycle",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/universal_mobility.jpg",
      label: "Doon Valley Transit Car",
      category: "car",
    },
    default: {
      src: "/images/vehicles/dehradun_rajpur_scooter.jpg",
      label: "Dehradun Mobility Fleet",
      category: "automatic_scooter",
    },
  },

  // 15. Tungnath–Chandrashila (Chopta Roadhead)
  "tungnath-chandrashila": {
    scooter: {
      src: "/images/vehicles/chopta_foothill_scooter.jpg",
      label: "Chopta Roadhead Hill Scooter",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/chopta_tungnath_adv_bike.jpg",
      label: "Chopta Chaukhamba Base Bullet",
      category: "classic_bullet",
    },
    adventure: {
      src: "/images/vehicles/chopta_tungnath_adv_bike.jpg",
      label: "Chopta Alpine Meadow Tourer",
      category: "adventure_motorcycle",
    },
    bicycle: {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Garhwal Alpine Trail MTB",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/universal_mobility.jpg",
      label: "Chopta Basecamp Sumo",
      category: "car",
    },
    default: {
      src: "/images/vehicles/chopta_tungnath_adv_bike.jpg",
      label: "Tungnath-Chopta Alpine Mobility",
      category: "adventure_motorcycle",
    },
  },

  // 16. Kainchi Dham
  "kainchi-dham": {
    scooter: {
      src: "/images/vehicles/kainchi_bhowali_scooter.jpg",
      label: "Bhowali-Kainchi Mountain Scooter",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/kainchi_kumaon_bike.jpg",
      label: "Kumaon Valley Heritage Cruiser",
      category: "classic_bullet",
    },
    adventure: {
      src: "/images/vehicles/kainchi_kumaon_bike.jpg",
      label: "Kumaon Hills Trail Tourer",
      category: "adventure_motorcycle",
    },
    bicycle: {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Kumaon Pine Trail Cycle",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/universal_mobility.jpg",
      label: "Nainital-Kainchi Transit",
      category: "car",
    },
    default: {
      src: "/images/vehicles/kainchi_bhowali_scooter.jpg",
      label: "Kainchi Dham Valley Mobility",
      category: "automatic_scooter",
    },
  },

  // 17. Agra
  agra: {
    scooter: {
      src: "/images/vehicles/agra_taj_scooter.jpg",
      label: "Taj East Gate EV Scooter",
      category: "electric_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/agra_taj_scooter.jpg",
      label: "Taj Heritage Tourer",
      category: "electric_scooter",
    },
    adventure: {
      src: "/images/vehicles/agra_taj_scooter.jpg",
      label: "Yamuna Corridor Tourer",
      category: "electric_scooter",
    },
    bicycle: {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Agra Heritage Green Cycle",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/agra_heritage_car.jpg",
      label: "Agra Heritage Boulevard Taxi",
      category: "car",
    },
    default: {
      src: "/images/vehicles/agra_taj_scooter.jpg",
      label: "Agra Heritage Mobility",
      category: "electric_scooter",
    },
  },

  // 18. Mathura & Vrindavan
  "mathura-vrindavan": {
    scooter: {
      src: "/images/vehicles/vrindavan_braj_scooter.jpg",
      label: "Vrindavan Braj Yatra Scooter",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/mathura_heritage_bullet.jpg",
      label: "Braj Bhoomi Heritage Bullet",
      category: "classic_bullet",
    },
    adventure: {
      src: "/images/vehicles/mathura_heritage_bullet.jpg",
      label: "Yamuna Parikrama Cruiser",
      category: "classic_bullet",
    },
    bicycle: {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Parikrama Marg Bicycle",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/universal_mobility.jpg",
      label: "Braj Yatra Tourist Cab",
      category: "car",
    },
    default: {
      src: "/images/vehicles/vrindavan_braj_scooter.jpg",
      label: "Mathura & Vrindavan Mobility",
      category: "automatic_scooter",
    },
  },

  // 19. Neemrana
  neemrana: {
    scooter: {
      src: "/images/vehicles/neemrana_fort_bullet.jpg",
      label: "Neemrana Local Cruiser",
      category: "classic_bullet",
    },
    motorcycle: {
      src: "/images/vehicles/neemrana_fort_bullet.jpg",
      label: "Neemrana Fort Palace Classic Bullet",
      category: "classic_bullet",
    },
    adventure: {
      src: "/images/vehicles/neemrana_fort_bullet.jpg",
      label: "Aravalli Highway Tourer",
      category: "classic_bullet",
    },
    car: {
      src: "/images/vehicles/neemrana_highway_car.jpg",
      label: "NH-48 Aravalli Highway Car",
      category: "car",
    },
    default: {
      src: "/images/vehicles/neemrana_fort_bullet.jpg",
      label: "Neemrana Fort Mobility",
      category: "classic_bullet",
    },
  },

  // 20. Damdama & Sohna
  "damdama-sohna": {
    scooter: {
      src: "/images/vehicles/damdama_lake_scooter.jpg",
      label: "Damdama Lake Aravalli Scooter",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/damdama_lake_scooter.jpg",
      label: "Sohna Ridge Lake Cruiser",
      category: "automatic_scooter",
    },
    adventure: {
      src: "/images/vehicles/damdama_lake_scooter.jpg",
      label: "Aravalli Off-Road Explorer",
      category: "automatic_scooter",
    },
    bicycle: {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Damdama Lake Trail MTB",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/universal_mobility.jpg",
      label: "Lakeside Day Escape Car",
      category: "car",
    },
    default: {
      src: "/images/vehicles/damdama_lake_scooter.jpg",
      label: "Damdama & Sohna Mobility",
      category: "automatic_scooter",
    },
  },

  // 21. Alwar & Siliserh
  "alwar-siliserh": {
    scooter: {
      src: "/images/vehicles/alwar_siliserh_scooter.jpg",
      label: "Siliserh Lake Palace Scooter",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/alwar_siliserh_scooter.jpg",
      label: "Alwar Bala Quila Cruiser",
      category: "automatic_scooter",
    },
    adventure: {
      src: "/images/vehicles/alwar_siliserh_scooter.jpg",
      label: "Aravalli Gap Adventure Bike",
      category: "automatic_scooter",
    },
    bicycle: {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Siliserh Lakefront Cycle",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/universal_mobility.jpg",
      label: "Alwar Heritage Tourist Taxi",
      category: "car",
    },
    default: {
      src: "/images/vehicles/alwar_siliserh_scooter.jpg",
      label: "Alwar & Siliserh Mobility",
      category: "automatic_scooter",
    },
  },

  // 22. Sariska & Bhangarh
  "sariska-bhangarh": {
    scooter: {
      src: "/images/vehicles/sariska_safari_adv_bike.jpg",
      label: "Alwar-Sariska Safari Tourer",
      category: "adventure_motorcycle",
    },
    motorcycle: {
      src: "/images/vehicles/sariska_safari_adv_bike.jpg",
      label: "Sariska Wilderness Safari Tourer",
      category: "adventure_motorcycle",
    },
    adventure: {
      src: "/images/vehicles/sariska_safari_adv_bike.jpg",
      label: "Sariska Tiger Safari Tourer",
      category: "adventure_motorcycle",
    },
    car: {
      src: "/images/vehicles/universal_mobility.jpg",
      label: "Sariska National Park Gypsy 4x4",
      category: "car",
    },
    default: {
      src: "/images/vehicles/sariska_safari_adv_bike.jpg",
      label: "Sariska & Bhangarh Safari Fleet",
      category: "adventure_motorcycle",
    },
  },

  // 23. Chandigarh
  chandigarh: {
    scooter: {
      src: "/images/vehicles/chandigarh_boulevard_ev.jpg",
      label: "Chandigarh Boulevard Smart EV",
      category: "electric_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/chandigarh_boulevard_ev.jpg",
      label: "Chandigarh Shivalik Highway EV",
      category: "electric_scooter",
    },
    bicycle: {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Sukhna Lake Green Track Cycle",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/universal_mobility.jpg",
      label: "Chandigarh Modernist City Car",
      category: "car",
    },
    default: {
      src: "/images/vehicles/chandigarh_boulevard_ev.jpg",
      label: "Chandigarh Urban Green Mobility",
      category: "electric_scooter",
    },
  },

  // 24. Morni Hills
  "morni-hills": {
    scooter: {
      src: "/images/vehicles/morni_hills_scooter.jpg",
      label: "Morni Shivalik Pine Hill Scooter",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/morni_shivalik_bike.jpg",
      label: "Tikkar Taal Lakeview Bullet",
      category: "classic_bullet",
    },
    adventure: {
      src: "/images/vehicles/morni_shivalik_bike.jpg",
      label: "Shivalik Hills Ridge Tourer",
      category: "classic_bullet",
    },
    bicycle: {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Morni Pine Trail MTB",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/universal_mobility.jpg",
      label: "Morni Hills Mountain Taxi",
      category: "car",
    },
    default: {
      src: "/images/vehicles/morni_hills_scooter.jpg",
      label: "Morni Hills Pine Mobility",
      category: "automatic_scooter",
    },
  },

  // 25. Lansdowne
  lansdowne: {
    scooter: {
      src: "/images/vehicles/lansdowne_ridge_scooter.jpg",
      label: "Lansdowne Blue Pine Ridge Scooter",
      category: "automatic_scooter",
    },
    motorcycle: {
      src: "/images/vehicles/lansdowne_pine_bullet.jpg",
      label: "Lansdowne Cantonment Classic Bullet",
      category: "classic_bullet",
    },
    adventure: {
      src: "/images/vehicles/lansdowne_pine_bullet.jpg",
      label: "Tip-in-Top Garhwal Tourer",
      category: "classic_bullet",
    },
    bicycle: {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Bhulla Tal Pine Trail Cycle",
      category: "mountain_bike",
    },
    car: {
      src: "/images/vehicles/universal_mobility.jpg",
      label: "Kotdwar-Lansdowne Hill Taxi",
      category: "car",
    },
    default: {
      src: "/images/vehicles/lansdowne_ridge_scooter.jpg",
      label: "Lansdowne Pine Ridge Mobility",
      category: "automatic_scooter",
    },
  },

  // 26. Murthal
  murthal: {
    scooter: {
      src: "/images/vehicles/murthal_gt_road_bullet.jpg",
      label: "GT Road Commuter Cruiser",
      category: "classic_bullet",
    },
    motorcycle: {
      src: "/images/vehicles/murthal_gt_road_bullet.jpg",
      label: "GT Road NH-44 Highway Bullet",
      category: "classic_bullet",
    },
    adventure: {
      src: "/images/vehicles/murthal_gt_road_bullet.jpg",
      label: "NH-44 Highway Tourer",
      category: "classic_bullet",
    },
    car: {
      src: "/images/vehicles/universal_mobility.jpg",
      label: "Delhi-Murthal Highway Car",
      category: "car",
    },
    default: {
      src: "/images/vehicles/murthal_gt_road_bullet.jpg",
      label: "Murthal Highway Cruisers",
      category: "classic_bullet",
    },
  },
};

/**
 * Known generic / fallback asset filenames that must NEVER override
 * an exact destination-specific artwork.
 */
const GENERIC_VEHICLE_PATTERNS = [
  "automatic_scooter.jpg",
  "universal_mobility.jpg",
  "classic_bullet.jpg",
  "adventure_motorcycle.jpg",
  "mountain_bike.jpg",
  "electric_scooter.jpg",
  "himachal_pine_forest_bike.jpg",
  "himachal_valley_scooter.jpg",
  "uttarakhand_forest_bike.jpg",
  "uttarakhand_valley_scooter.jpg",
  "rajasthan_classic_bullet.jpg",
  "rajasthan_desert_bike.jpg",
  "rajasthan_urban_scooter.jpg",
  "coastal_beach_scooter.jpg",
  "coastal_heritage_bike.jpg",
  "coastal_palm_scooter.jpg",
  "south_tea_scooter.jpg",
  "generic",
  "unsplash.com",
];

export function isGenericArtwork(url?: string | null): boolean {
  if (!url || typeof url !== "string") return true;
  const lower = url.toLowerCase();
  return GENERIC_VEHICLE_PATTERNS.some((p) => lower.includes(p));
}

/**
 * Normalizes destination string into canonical key.
 */
function normalizeDestinationKey(dest?: string): string {
  if (!dest) return "";
  const s = dest.toLowerCase().trim();
  
  if (s.includes("mussoorie") || s.includes("landour")) return "mussoorie";
  if (s.includes("goa") || s.includes("gokarna")) return "goa";
  if (s.includes("jaipur") || s.includes("pink city") || s.includes("amer")) return "jaipur";
  if (s.includes("udaipur") || s.includes("pichola") || s.includes("mewar")) return "udaipur";
  if (s.includes("varanasi") || s.includes("kashi") || s.includes("banaras") || s.includes("benaras")) return "varanasi";
  if (s.includes("leh") || s.includes("ladakh")) return "leh";
  if (s.includes("spiti") || s.includes("kaza")) return "spiti";
  if (s.includes("munnar") || s.includes("kerala")) return "munnar";
  if (s.includes("jaisalmer") || s.includes("thar") || s.includes("sam dunes")) return "jaisalmer";
  if (s.includes("rishikesh") || s.includes("tapovan")) return "rishikesh";
  if (s.includes("manali") || s.includes("solang")) return "manali";
  if (s.includes("dharamshala") || s.includes("mcleod") || s.includes("bhagsu") || s.includes("dharamsala")) return "dharamshala";
  if (s.includes("kasol") || s.includes("parvati")) return "kasol";
  if (s.includes("dehradun") || s.includes("rajpur")) return "dehradun";
  if (s.includes("tungnath") || s.includes("chopta") || s.includes("chandrashila")) return "tungnath-chandrashila";
  if (s.includes("kainchi") || s.includes("bhowali") || s.includes("neem karoli")) return "kainchi-dham";
  if (s.includes("agra") || s.includes("taj")) return "agra";
  if (s.includes("mathura") || s.includes("vrindavan") || s.includes("braj")) return "mathura-vrindavan";
  if (s.includes("neemrana")) return "neemrana";
  if (s.includes("damdama") || s.includes("sohna")) return "damdama-sohna";
  if (s.includes("alwar") || s.includes("siliserh")) return "alwar-siliserh";
  if (s.includes("sariska") || s.includes("bhangarh")) return "sariska-bhangarh";
  if (s.includes("chandigarh")) return "chandigarh";
  if (s.includes("morni")) return "morni-hills";
  if (s.includes("lansdowne")) return "lansdowne";
  if (s.includes("murthal")) return "murthal";

  return s.replace(/[^a-z0-9]/g, "-");
}

/**
 * Deterministically resolves vehicle type/name/model and destination context
 * to the appropriate regional VANVAS editorial mobility artworks.
 */
export function resolveVehicleArtwork(
  typeOrName?: string,
  destinationOrContext?: string | MobilityContext,
  secondaryName?: string
): ArtworkResult {
  const combined = `${typeOrName || ""} ${secondaryName || ""}`.toLowerCase().trim();
  
  let destStr = "";
  if (typeof destinationOrContext === "string") {
    destStr = destinationOrContext;
  } else if (destinationOrContext && typeof destinationOrContext === "object") {
    destStr = destinationOrContext.destination || destinationOrContext.region || destinationOrContext.state || "";
  }

  const destKey = normalizeDestinationKey(destStr);
  const destFleet = DESTINATION_VEHICLE_REGISTRY[destKey];

  // Specific vehicle category detection
  const isElectric =
    combined.includes("electric_scooter") ||
    combined.includes("electric scooter") ||
    combined.includes("electric") ||
    combined.includes("ev") ||
    combined.includes("ather") ||
    combined.includes("ola") ||
    combined.includes("chetak") ||
    combined.includes("iqube");

  const isScooter =
    isElectric ||
    combined.includes("automatic_scooter") ||
    combined.includes("automatic scooter") ||
    combined.includes("activa") ||
    combined.includes("scooter") ||
    combined.includes("automatic") ||
    combined.includes("jupiter") ||
    combined.includes("access") ||
    combined.includes("vespa") ||
    combined.includes("moped") ||
    combined.includes("ntorq") ||
    combined.includes("fascino") ||
    combined.includes("pleasure") ||
    combined.includes("dio") ||
    combined.includes("burgman") ||
    combined.includes("destini") ||
    combined.includes("rayzr") ||
    combined.includes("aerox") ||
    combined.includes("scooty");

  const isAdventure =
    combined.includes("adventure_motorcycle") ||
    combined.includes("adventure motorcycle") ||
    combined.includes("himalayan") ||
    combined.includes("adventure") ||
    combined.includes("adv") ||
    combined.includes("450") ||
    combined.includes("411") ||
    combined.includes("off-road") ||
    combined.includes("offroad") ||
    combined.includes("scrambler") ||
    combined.includes("xpulse") ||
    combined.includes("ktm") ||
    combined.includes("gs") ||
    combined.includes("rally");

  const isClassicBullet =
    combined.includes("classic_bullet") ||
    combined.includes("classic bullet") ||
    combined.includes("bullet") ||
    combined.includes("classic") ||
    combined.includes("enfield") ||
    combined.includes("royal enfield") ||
    combined.includes("350") ||
    combined.includes("cruiser") ||
    combined.includes("standard") ||
    combined.includes("interceptor") ||
    combined.includes("hunter") ||
    combined.includes("meteor") ||
    combined.includes("gt 650") ||
    combined.includes("motorcycle") ||
    combined.includes("bike") ||
    combined.includes("fz") ||
    combined.includes("pulsar") ||
    combined.includes("apache") ||
    combined.includes("avenger");

  const isCar =
    !isClassicBullet &&
    !isAdventure &&
    (combined.includes("car") ||
      combined.includes("self-drive") ||
      combined.includes("self drive") ||
      combined.includes("suv") ||
      combined.includes("sedan") ||
      combined.includes("hatchback") ||
      combined.includes("mahindra thar") ||
      combined.includes("thar 4x4") ||
      combined.includes("creta") ||
      combined.includes("swift") ||
      combined.includes("baleno") ||
      combined.includes("i20") ||
      combined.includes("scorpio") ||
      combined.includes("innova") ||
      combined.includes("ertiga") ||
      combined.includes("seltos"));

  const isBicycle =
    combined.includes("mountain_bike") ||
    combined.includes("mountain bike") ||
    combined.includes("bicycle") ||
    combined.includes("mtb") ||
    combined.includes("pedal") ||
    (combined.includes("cycle") && !combined.includes("motorcycle") && !combined.includes("motor cycle"));

  // 1. Destination-Matched Explicit Resolution (Absolute Destination Priority)
  if (destFleet) {
    if (isScooter && destFleet.scooter) return destFleet.scooter;
    if (isAdventure && destFleet.adventure) return destFleet.adventure;
    if (isBicycle && destFleet.bicycle) return destFleet.bicycle;
    if (isClassicBullet && destFleet.motorcycle) return destFleet.motorcycle;
    if (isCar && destFleet.car) return destFleet.car;
    return destFleet.default;
  }

  // 2. Regional / General Defaults only when destination is unknown
  if (isBicycle) {
    return {
      src: "/images/vehicles/mountain_bike.jpg",
      label: "Mountain Trail Cycle",
      category: "mountain_bike",
    };
  }
  if (isElectric) {
    return {
      src: "/images/vehicles/electric_scooter.jpg",
      label: "Smart Mountain EV",
      category: "electric_scooter",
    };
  }
  if (isScooter) {
    return {
      src: "/images/vehicles/automatic_scooter.jpg",
      label: "Automatic Hill Scooter",
      category: "automatic_scooter",
    };
  }
  if (isAdventure) {
    return {
      src: "/images/vehicles/adventure_motorcycle.jpg",
      label: "Himalayan Adventure Tourer",
      category: "adventure_motorcycle",
    };
  }
  if (isClassicBullet) {
    return {
      src: "/images/vehicles/classic_bullet.jpg",
      label: "Classic Himalayan Bullet",
      category: "classic_bullet",
    };
  }

  return {
    src: "/images/vehicles/automatic_scooter.jpg",
    label: "Valley Mobility Fleet",
    category: "automatic_scooter",
  };
}

export const VehicleArtwork: React.FC<VehicleArtworkProps> = ({
  type,
  name,
  destination,
  context,
  imageUrl,
  alt,
  className = "w-full h-full object-cover",
  containerClassName = "",
  aspectRatio = "fill",
  priority = false,
  showBadge = true,
}) => {
  const destCtx = context || (destination ? { destination } : undefined);
  const artwork = resolveVehicleArtwork(type, destCtx, name);
  const [hasError, setHasError] = useState(false);

  // Deterministic destination-first artwork:
  // Artwork resolved for the destination has absolute priority over generic/regional fallbacks.
  let finalSrc = artwork.src;
  
  // Custom explicit destination-specific imageUrl from backend only if not a generic fallback
  if (
    imageUrl &&
    typeof imageUrl === "string" &&
    imageUrl.length > 0 &&
    !isGenericArtwork(imageUrl)
  ) {
    finalSrc = imageUrl;
  }

  if (hasError) {
    finalSrc = "/images/vehicles/universal_mobility.jpg";
  }

  const aspectClass =
    aspectRatio === "video"
      ? "aspect-[16/10]"
      : aspectRatio === "square"
      ? "aspect-square"
      : aspectRatio === "wide"
      ? "aspect-[21/9]"
      : "w-full h-full";

  return (
    <div
      className={`relative overflow-hidden bg-brand-sand-100 ${aspectClass} ${containerClassName}`}
    >
      <Image
        src={finalSrc}
        alt={alt || artwork.label}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        priority={priority}
        className={`transition-transform duration-700 hover:scale-105 ${className}`}
        onError={() => setHasError(true)}
      />
      {showBadge && (
        <div className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded bg-[#0F2924]/85 backdrop-blur-md text-[#FAF4E8] text-[10px] font-sans tracking-wide uppercase font-medium shadow-sm border border-white/10 pointer-events-none">
          VANVAS Mobility • {artwork.label}
        </div>
      )}
    </div>
  );
};

