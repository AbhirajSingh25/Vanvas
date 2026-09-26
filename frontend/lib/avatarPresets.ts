export interface AvatarPreset {
  id: string;
  name: string;
  hindiName: string;
  tagline: string;
  src: string;
  category: "mountains" | "heritage" | "road" | "nature" | "lifestyle";
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: "himalayan-explorer",
    name: "Himalayan Explorer",
    hindiName: "हिमालयी खोजी",
    tagline: "High alpine ridge walks & snow line expeditions",
    src: "/avatars/himalayan-explorer.svg",
    category: "mountains",
  },
  {
    id: "wayfarer",
    name: "The Wayfarer",
    hindiName: "राही",
    tagline: "Timeless Indian explorer charting quiet roads",
    src: "/avatars/wayfarer.svg",
    category: "lifestyle",
  },
  {
    id: "mountain-camper",
    name: "Mountain Camper",
    hindiName: "पहाड़ी कैम्पर",
    tagline: "A-frame tents under starry Himalayan night skies",
    src: "/avatars/mountain-camper.svg",
    category: "mountains",
  },
  {
    id: "heritage-wanderer",
    name: "Heritage Wanderer",
    hindiName: "शाही मुसाफ़िर",
    tagline: "Sandstone forts, jharokha arches & desert sunsets",
    src: "/avatars/heritage-wanderer.svg",
    category: "heritage",
  },
  {
    id: "river-roamer",
    name: "River Roamer",
    hindiName: "नदी पथिक",
    tagline: "Sacred ghat currents, wooden boats & dawn mist",
    src: "/avatars/river-roamer.svg",
    category: "nature",
  },
  {
    id: "desert-nomad",
    name: "Desert Nomad",
    hindiName: "मरुस्थल यात्री",
    tagline: "Golden sand dune ripples & starry desert nights",
    src: "/avatars/desert-nomad.svg",
    category: "heritage",
  },
  {
    id: "forest-walker",
    name: "Forest Walker",
    hindiName: "वन पथिक",
    tagline: "Deodar pine canopies & misty jungle walking trails",
    src: "/avatars/forest-walker.svg",
    category: "nature",
  },
  {
    id: "road-tripper",
    name: "Road Tripper",
    hindiName: "हाईवे राइडर",
    tagline: "NH-44 dawn sprints, roadside dhabas & milestones",
    src: "/avatars/road-tripper.svg",
    category: "road",
  },
  {
    id: "trail-photographer",
    name: "Trail Photographer",
    hindiName: "दृश्य छायाकार",
    tagline: "Mechanical rangefinders capturing mountain light",
    src: "/avatars/trail-photographer.svg",
    category: "lifestyle",
  },
  {
    id: "backpacker",
    name: "Backpacker",
    hindiName: "झोलाछाप मुसाफ़िर",
    tagline: "Rugged rucksacks, trekking poles & open horizons",
    src: "/avatars/backpacker.svg",
    category: "lifestyle",
  },
  {
    id: "cafe-wanderer",
    name: "Café Wanderer",
    hindiName: "कैफ़े खोजी",
    tagline: "Steaming mountain chai & hillside wooden desks",
    src: "/avatars/cafe-wanderer.svg",
    category: "lifestyle",
  },
  {
    id: "night-traveller",
    name: "Night Traveller",
    hindiName: "निशाचर राही",
    tagline: "Crescent moon highways & campfire sparks",
    src: "/avatars/night-traveller.svg",
    category: "road",
  },
];

export function getAvatarPresetById(id?: string | null): AvatarPreset | undefined {
  if (!id) return undefined;
  return AVATAR_PRESETS.find((p) => p.id === id);
}
