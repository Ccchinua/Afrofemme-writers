import type {MetadataRoute} from "next";
export default function sitemap():MetadataRoute.Sitemap{
 const base=process.env.NEXT_PUBLIC_SITE_URL||"https://afrofemme-writers.vercel.app";
 const pages=["","/stories","/annual","/challenges","/voices","/writers","/spotlight","/events","/gatherings","/signup","/login","/privacy","/terms","/community-guidelines"];
 return pages.map(path=>({url:base.replace(/\/$/,"")+path,lastModified:new Date(),changeFrequency:path==="/stories"||path==="/annual"||path==="/challenges"?"daily":"weekly",priority:path===""?1:path==="/stories"||path==="/annual"?.9:.4}));
}
