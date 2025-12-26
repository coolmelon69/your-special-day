import { AlertCircle } from "lucide-react";

const AdminSettings = () => {

  return (
    <div className="space-y-6">
      <h2
        className="font-pixel text-lg md:text-xl text-[hsl(15_70%_40%)]"
        style={{
          textRendering: "optimizeSpeed",
          WebkitFontSmoothing: "none",
          MozOsxFontSmoothing: "unset",
          fontSmooth: "never",
          letterSpacing: "0.05em",
        }}
      >
        Settings
      </h2>

      {/* Info */}
      <div className="bg-[hsl(200_60%_55%)] border-2 border-[hsl(200_50%_45%)] p-4 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
        <div>
          <p
            className="font-pixel text-xs text-white mb-1"
            style={{ textRendering: "optimizeSpeed" }}
          >
            <strong>Note:</strong> Custom stamps and coupons are automatically shown together with
            default items. They appear after the default items in the list.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;




