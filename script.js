const projects = {
  "atelier-north": {
    title: "Atelier North",
    category: "Brand Portraits / Studio Essay",
    client: "Atelier North",
    location: "Vancouver, BC",
    year: "2026",
    image: "https://images.unsplash.com/photo-1506629905607-d9f297d85cb4?auto=format&fit=crop&w=1800&q=88",
    alt: "自然光工作室中的商业人像项目封面",
    description:
      "A quiet brand portrait session shaped around pale walls, winter daylight, and the small gestures that make a founder feel present without becoming over-directed.",
  },
  "west-end": {
    title: "West End Notes",
    category: "Travel / Lifestyle Campaign",
    client: "Independent Editorial",
    location: "Seattle, WA",
    year: "2025",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1800&q=88",
    alt: "街区生活方式摄影项目封面",
    description:
      "A cinematic walk through late-afternoon streets, using warm concrete, passing light, and unscripted posture to frame a modern North American lifestyle story.",
  },
  "table-studies": {
    title: "Table Studies",
    category: "Still Life / Hospitality",
    client: "Private Restaurant Group",
    location: "New York, NY",
    year: "2025",
    image: "https://images.unsplash.com/photo-1516594798947-e65505dbb29d?auto=format&fit=crop&w=1800&q=88",
    alt: "餐桌静物与材质细节项目封面",
    description:
      "A restrained still-life direction system for seasonal menus: low contrast, tactile materials, imperfect placement, and a warm editorial palette.",
  },
  "city-light": {
    title: "City Light",
    category: "Editorial Portraits",
    client: "Culture Desk",
    location: "Toronto, ON",
    year: "2024",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1800&q=88",
    alt: "城市窗光中的编辑人像项目封面",
    description:
      "Portraits made between glass, shadow, and quiet pauses; designed for an editorial feature that needed confidence without a glossy commercial finish.",
  },
};

const revealElements = document.querySelectorAll(".reveal");
const projectDialog = document.querySelector("#project-dialog");
const closeDialogButton = document.querySelector(".close-dialog");
const projectButtons = document.querySelectorAll("[data-project]");
const dialogImage = document.querySelector("#dialog-image");
const dialogCategory = document.querySelector("#dialog-category");
const dialogTitle = document.querySelector("#dialog-title");
const dialogDescription = document.querySelector("#dialog-description");
const dialogClient = document.querySelector("#dialog-client");
const dialogLocation = document.querySelector("#dialog-location");
const dialogYear = document.querySelector("#dialog-year");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

revealElements.forEach((element) => revealObserver.observe(element));

function openProject(projectId) {
  const project = projects[projectId];

  if (!project) {
    return;
  }

  dialogImage.src = project.image;
  dialogImage.alt = project.alt;
  dialogCategory.textContent = project.category;
  dialogTitle.textContent = project.title;
  dialogDescription.textContent = project.description;
  dialogClient.textContent = project.client;
  dialogLocation.textContent = project.location;
  dialogYear.textContent = project.year;

  if (typeof projectDialog.showModal === "function") {
    projectDialog.showModal();
    document.body.classList.add("dialog-open");
  }
}

function closeProject() {
  projectDialog.close();
  document.body.classList.remove("dialog-open");
}

projectButtons.forEach((button) => {
  button.addEventListener("click", () => openProject(button.dataset.project));
});

closeDialogButton.addEventListener("click", closeProject);

projectDialog.addEventListener("click", (event) => {
  if (event.target === projectDialog) {
    closeProject();
  }
});

projectDialog.addEventListener("close", () => {
  document.body.classList.remove("dialog-open");
});
