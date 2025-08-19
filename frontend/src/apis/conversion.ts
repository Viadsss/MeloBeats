import axios from "@/lib/axios";
import type { ConversionData, InitialConvert } from "@/types";

export type GetConversionStatus = {
  success: boolean;
  data: ConversionData;
};

export const getConversionStatus = async (id: string) => {
  const response = await axios.get(`api/convert/${id}/status`);
  const data: ConversionData = response.data.data;
  return data;
};

export const postConvert = async (url: string) => {
  const response = await axios.post("api/convert", { url });
  const data: InitialConvert = response.data;
  return data;
};
