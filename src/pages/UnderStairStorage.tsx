import ServicePage from './ServicePage';

const UnderStairStorage = () => {
  return (
    <ServicePage
      title="Under Stair Storage Solutions"
      description="Maximise unused space with bespoke under stair storage solutions, from pull-out drawers to hidden cabinets tailored to your staircase."
      heroImage="https://c.pxhere.com/photos/5c/3f/photo-1606932.jpg!d"
      content={[
        {
          heading: "Maximize Your Space",
          text: "Don't let the space under your stairs go to waste. Our bespoke under stair storage solutions transform this often-overlooked area into valuable storage space. Whether you need a coat closet, pantry, home office, or general storage, we design custom solutions that make the most of every inch."
        },
        {
          heading: "Custom-Built Solutions",
          text: "Every staircase is unique, and so are our storage solutions. We carefully measure and design storage systems that perfectly fit the awkward angles and dimensions under your stairs. From pull-out drawers and rotating carousels to built-in shelving and hanging systems, we create storage that works for your lifestyle."
        },
        {
          heading: "Clever Design Features",
          text: "Our under stair storage solutions incorporate clever design features that maximize accessibility and functionality. We use soft-close hinges, pull-out mechanisms, and interior lighting to make your storage both practical and pleasant to use. Every design is tailored to your specific storage needs and home's aesthetic."
        }
      ]}
      features={[
        "Pull-out drawer systems",
        "Built-in shelving and compartments",
        "Coat and shoe storage solutions",
        "Pantry and kitchen storage",
        "Home office nooks",
        "Wine storage and display",
        "Sports equipment storage",
        "LED lighting integration"
      ]}
    />
  );
};

export default UnderStairStorage;