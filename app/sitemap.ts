import type {MetadataRoute} from "next";
export default function sitemap():MetadataRoute.Sitemap{
 const base=process.env.NEXT_PUBLIC_SITE_URL||"https://afrofemme-writers.vercel.app";
 return ["","/stories","/signup","/login","/privacy","/terms","/community-guidelines"].map(path=>({url:base.replace(/\/$/,"")+path,lastModified:new Date(),changeFrequency:path==="/stories"?"daily":"weekly",priority:path===""?1:path==="/stories"?.9:.4}));
}