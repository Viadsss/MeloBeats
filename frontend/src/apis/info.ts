import axios from "@/lib/axios";
import type { Info, InfoOptions } from "@/types";
import type { AxiosResponse } from "axios";

export type GetInfoResponse = {
  info: InfoOptions;
  success: boolean;
  data: Info;
};

export const getInfo = async (url: string) => {
  const response: AxiosResponse<GetInfoResponse> = await axios.post(
    "api/info",
    { url },
  );
  const data = response.data;
  return data;
};
