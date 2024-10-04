import fs from "fs";
import path from "path";
import React from "react";
import lab from "../../data/lab.json"
import matter from "gray-matter";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeMdxCodeProps from "rehype-mdx-code-props";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import Image from "next/image";
import "highlight.js/styles/tokyo-night-dark.css";

// Components
// import Sidebar from "@/components/Sidebar";
// import Footer from "@/components/Footer";
// import Note from "@/components/MDX/Note";
// import FileStructure from "@/components/MDX/FileStructure";
import Head from 'next/head'

function index({ lang, page, mdxSource, navigation, metadata }) {
  
  let getMetadata = (data) => {
    if(metadata[data] === undefined || metadata[data] === false){
      return `${lang}, ${page}, ${lab.content[data]}`
    }
    return `${metadata[data]}, ${lang}, ${page}, ${lab.content[data]}`
  }
  
  return (
    <>
      <Head>
        <title>{metadata.title || lab.content.title}</title>

        <meta name="description" content={metadata.description || lab.content.description} />
        <meta name="title" content={metadata.title || lab.content.title} />
        <meta name="keywords" content={getMetadata("keywords")} />
        <meta name="tags" content={getMetadata("tags")} />

        <meta property="og:title" content={metadata.title || lab.content.title} />
        <meta property="og:description" content={metadata.description || lab.content.description} />
        <meta property="og:url" content={`${lab.siteURL}/${lang}/${page}`} />
        <meta property="og:type" content={lab.content.type || "article"} />

        <meta property="author" content={lab.author} />

        <meta property="twitter:title" content={metadata.title} />
        <meta property="twitter:description" content={metadata.description} />
        <meta property="twitter:card" content={lab.twiter.card} />
        <meta property="twitter:site" content={lab.twiter.username} />
        <meta property="twitter:creator" content={lab.twiter.username} />

        <meta property="copyrights" content={lab.copyrights} />
      </Head>
      <div className={`md:grid md:grid-cols-only-content ${navigation && 'lg:grid-cols-sidebar-content'}`}>
        {navigation &&
          <div className="sticky h-[calc(100vh-69px)] top-[69px] hidden lg:block overflow-y-scroll pl-2">
            {/* <Sidebar routing={navigation} pageRoute={`${lang}${page !== "index" ? `/${page}` : ''}`} /> */}
          </div>
        }
        {/* <div className="sticky h-[calc(100vh-69px)] top-[69px] hidden xl:block order-last"></div> */}
        <div className="prose sm:prose-base lg:prose-lg px-2 lg:px-5 py-12 md:py-28 mx-auto">
          <MDXRemote
            compiledSource={mdxSource.compiledSource}
            scope={mdxSource.scope}
            frontmatter={mdxSource.frontmatter}
            components={{
              img: ({
                src = "",
                alt = "Article Image View",
                title = undefined,
              }) => (
                <Image
                  src={src}
                  alt={alt}
                  title={title}
                  width={900}
                  height={300}
                  priority
                  fetchPriority="high"
                  className="rounded-xl"
                />
              ),
              pre: (props) => {
                return <pre {...props} className="!rounded-2xl" />;
              },
              summary: (props) => {
                return <summary className="summary"></summary>
              },
              Kb: (props) => {
                return <kbd className="bg-gray-800 text-white">{props.children}</kbd>;
              },
            //   Note: Note,
            //   FileStructure: FileStructure
            }}
          />
          {/* <Footer /> */}
        </div>
      </div>
    </>
  );
}

export default index;

export async function getStaticPaths() {
  return {
    paths: ["/doc"],
    fallback: "blocking",
  };
}

export async function getStaticProps(content) {
  const { slug } = content.params;
  const [lang, page = "index", ...rest] = slug;

  let mdxDirectory, fileNames, filePath, fileContent, mdxSource, navigation, isDir;

  mdxDirectory = path.join(process.cwd(), `data/${lang}`);

  isDir = fs.existsSync(mdxDirectory) && fs.lstatSync(mdxDirectory).isDirectory()

  try {
    fileNames = isDir ? fs.readdirSync(mdxDirectory) : [];

    if (fileNames.includes("index.json") && isDir) {
      navigation = fs.readFileSync(path.join(mdxDirectory, `index.json`), "utf-8")
      navigation = JSON.parse(navigation)
    } else {
      navigation = false
    }

    // Read file content as it is means rawData
    if (isDir) {
      filePath = path.join(mdxDirectory, `${page}.mdx`);
    } else {
      filePath = path.join(process.cwd(), 'data/')
      filePath = path.join(filePath, `${lang}.mdx`)
    }
    fileContent = fs.readFileSync(filePath, "utf-8");

    // Read file content and convert to content and metadata objects
    const { content, data } = matter(fileContent);

    // serialize using mdx
    mdxSource = await serialize(content, {
      parseFrontmatter: true,
      scope: data,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeHighlight,
          rehypeMdxCodeProps,
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: "before", // 'wrap', 'prepend', 'append', 'after'
            },
          ],
        ],
      },
    });
  } catch (error) {
    return {
      notFound: true,
    };
  }

  return {
    props: {
      lang,
      page,
      mdxSource,
      navigation,
      metadata: mdxSource.scope
    },
  };
}