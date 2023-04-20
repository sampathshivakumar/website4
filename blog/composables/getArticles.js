import { callWithNuxt } from "#app";

export default async (params, filter, nuxtApp) => {
  try {
    const currentPage = parseInt(params?.page) || 1;

    let allArticles = queryContent("blog/posts");
    const perPage = globals.blogsPerPage;

    const skipNumber = () => {
      if (currentPage === 1) {
        return 0;
      }
      return (currentPage - 1) * perPage;
    };

    let articles = queryContent("blog/posts")
      .only([
        "title",
        "description",
        "categories",
        "tags",
        "img",
        "slug",
        "author",
        "publishDate",
        "createdAt",
        "updatedAt",
      ])
      .sort({ publishDate: -1 })
      .limit(perPage)
      .skip(skipNumber());

    //check for filters
    if (filter) {
      switch (filter.type) {
        case "category": {
          const categories = await getCategories();
          const slug = filter.value;
          let nameFromSlug = categories.find((item) => item.slug == slug);

          // just verify we have found the slug
          if (nameFromSlug) {
            nameFromSlug = nameFromSlug.name;
          }

          // add the query
          articles.where({ categories: { $contains: [nameFromSlug] } });
          allArticles.where({ categories: { $contains: [nameFromSlug] } });
          break;
        }
        case "tag": {
          const tags = await getTags();
          const slug = filter.value;
          let nameFromSlug = tags.find((item) => item.slug == slug);

          // just verify we have found the slug
          if (nameFromSlug) {
            nameFromSlug = nameFromSlug.name;
          }

          // add the query
          articles.where({ tags: { $contains: [nameFromSlug] } });
          allArticles.where({ tags: { $contains: [nameFromSlug] } });
          break;
        }
        case "author": {
          articles.where({ author: filter.value });
          allArticles.where({ author: filter.value });
          break;
        }
      }
    }

    [allArticles, articles] = await callWithNuxt(nuxtApp, () =>
      Promise.all([allArticles.only(["title"]).find(), articles.find()])
    );

    const totalArticles = allArticles.length;

    // use Math.ceil to round up to the nearest whole number for total pages
    const lastPage = Math.ceil(totalArticles / perPage);

    if (currentPage === 0 || !articles.length) {
      // return error({ statusCode: 404, message: "No articles found!" });
    }

    return {
      articles,
      totalArticles,
      lastPage,
      currentPage,
    };
  } catch (e) {
    console.log(e);
  }
};

const slugify = (str) => {
  const separator = "-";
  // Ref: https://gist.github.com/codeguy/6684588#gistcomment-3426313
  return str
    .toString()
    .normalize("NFD") // split an accented letter in the base letter and the acent
    .replace(/[\u0300-\u036f]/g, "") // remove all previously split accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, "") // remove all chars not letters, numbers and spaces (to be replaced)
    .replace(/\s+/g, separator);
};
