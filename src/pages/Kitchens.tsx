import ServicePage from './ServicePage';

const Kitchens = () => {
  return (
    <ServicePage
      title="Bespoke Kitchen Design & Installation"
      description="Our kitchen fitting service encompasses design consultation, custom cabinetry, and seamless installation. We create kitchens that reflect your style and meet your functional needs."
      heroImage="https://c.pxhere.com/photos/69/3c/kitchen_interior_luxury_home_modern_design_kitchen_interior_house-1370531.jpg!d"
      content={[
        {
          heading: "Complete Kitchen Solutions",
          text: "Transform your kitchen into the heart of your home with our comprehensive kitchen design and installation services. From initial consultation to final installation, we handle every aspect of your kitchen project. Our experienced team works with you to create a space that combines functionality with stunning aesthetics."
        },
        {
          heading: "Custom Cabinetry & Storage",
          text: "Our bespoke kitchen cabinets are crafted to maximize your space and storage needs. We design and build custom solutions that fit your lifestyle, from clever corner units to innovative pull-out drawers. Every cabinet is made to measure, ensuring perfect fit and optimal use of your kitchen space."
        },
        {
          heading: "Professional Installation",
          text: "Our skilled installation team ensures your new kitchen is fitted to the highest standards. We coordinate all aspects of the installation process, working with trusted plumbers and electricians to deliver a seamless experience. Your kitchen will be ready to use with minimal disruption to your daily routine."
        }
      ]}
      features={[
        "Complete kitchen design and planning",
        "Custom cabinet design and manufacture",
        "Worktop installation (granite, quartz, wood)",
        "Kitchen island and breakfast bar creation",
        "Appliance integration and installation",
        "Lighting design and installation",
        "Plumbing and electrical coordination",
        "Project management from start to finish"
      ]}
    />
  );
};

export default Kitchens;