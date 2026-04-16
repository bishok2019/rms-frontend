import { toast } from "sonner";

export const successFunction = (message: string) => {
  const alertMessage = message ? message : "Success";
  toast.success(alertMessage, {
    duration: 5000,
    position: "top-right",
  });
};

export const errorFunction = (message: string) => {
  const alertMessage = message ? message : "Error";
  toast.error(alertMessage, {
    duration: 5000,
    position: "top-right",
  });
};

export const infoFunction = (message: string) => {
  const alertMessage = message ? message : "Info";
  toast.info(alertMessage, {
    duration: 5000,
    position: "top-right",
  });
};

export const warningFunction = (message: string) => {
  const alertMessage = message ? message : "Warning";
  toast.warning(alertMessage, {
    duration: 5000,
    position: "top-right",
  });
};
