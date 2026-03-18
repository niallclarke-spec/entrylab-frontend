
// Forces all commonly-used packages into Vite's initial dependency
// pre-bundling scan. Without this, lazy-loaded components can trigger
// late-discovery re-optimisation mid-session, which changes the React chunk
// hash while react-dom stays cached — causing a null-dispatcher crash.
// Importing these here (even as bare side-effects) is enough for Vite to
// include them in the first optimisation pass and prevents any mid-session
// full-reload triggered by dep re-optimisation.
import "@radix-ui/react-accordion";
import "@radix-ui/react-alert-dialog";
import "@radix-ui/react-aspect-ratio";
import "@radix-ui/react-avatar";
import "@radix-ui/react-checkbox";
import "@radix-ui/react-collapsible";
import "@radix-ui/react-context-menu";
import "@radix-ui/react-dialog";
import "@radix-ui/react-dropdown-menu";
import "@radix-ui/react-hover-card";
import "@radix-ui/react-label";
import "@radix-ui/react-menubar";
import "@radix-ui/react-navigation-menu";
import "@radix-ui/react-popover";
import "@radix-ui/react-progress";
import "@radix-ui/react-radio-group";
import "@radix-ui/react-scroll-area";
import "@radix-ui/react-select";
import "@radix-ui/react-separator";
import "@radix-ui/react-slider";
import "@radix-ui/react-slot";
import "@radix-ui/react-switch";
import "@radix-ui/react-tabs";
import "@radix-ui/react-toast";
import "@radix-ui/react-toggle";
import "@radix-ui/react-toggle-group";
import "@radix-ui/react-tooltip";
import "cmdk";
import "embla-carousel-react";
import "framer-motion";
import "input-otp";
import "react-day-picker";
import "react-hook-form";
import "react-resizable-panels";
import "recharts";
import "vaul";
