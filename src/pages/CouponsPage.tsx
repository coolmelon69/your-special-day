import { Helmet } from "react-helmet-async";
import GiftCouponsSection from "@/components/GiftCouponsSection";
import Footer from "@/components/Footer";
import { useAdventure } from "@/contexts/AdventureContext";

const CouponsPage = () => {
  const { itineraryState } = useAdventure();

  return (
    <>
      <Helmet>
        <title>Gift Coupons - Your Special Day</title>
        <meta name="description" content="Redeem your special gift coupons" />
      </Helmet>
      
      <main className="overflow-x-hidden pt-16 md:pt-20">
        <GiftCouponsSection itineraryState={itineraryState} />

        <Footer />
      </main>
    </>
  );
};

export default CouponsPage;




