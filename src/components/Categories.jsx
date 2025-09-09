import React from "react";
import { useNavigate } from "react-router-dom";

const Categories = () => {
  const navigate = useNavigate();
  const categories = [
    {
      name: "Women",
      description: "Stay trendy with our curated collection.",
      image: "/women.png",
      bgColor: "bg-pink-50",
      hover: "hover:shadow-pink-200",
      path: "/category/women",
    },
    {
      name: "Men",
      description: "Elevate your style with smart essentials.",
      image: "/men.png",
      bgColor: "bg-blue-50",
      hover: "hover:shadow-blue-200",
      path: "/category/men",
    },
    {
      name: "Kids",
      description: "Fun and comfy picks for the little ones.",
      image: "/kids.png",
      bgColor: "bg-green-50",
      hover: "hover:shadow-green-200",
      path: "/category/kids",
    },
  ];

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-blue-600 mb-8">
          Shop by <span className="text-black">category</span>
        </h2>

        {/* Desktop Grid */}
        <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <div
              key={category.name}
              onClick={() => navigate(category.path)}
              className={`${category.bgColor} rounded-xl p-6 shadow-md ${category.hover} hover:shadow-lg transition-shadow duration-300 cursor-pointer`}
            >
              <div className="flex items-center gap-4">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-16 h-16 object-contain rounded-lg"
                />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {category.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {category.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Horizontal Scroll */}
        <div className="md:hidden flex gap-4 overflow-x-auto scrollbar-hide">
          {categories.map((category) => (
            <div
              key={category.name}
              onClick={() => navigate(category.path)}
              className={`${category.bgColor} min-w-[240px] flex-shrink-0 rounded-xl p-5 shadow ${category.hover} hover:shadow-lg transition-shadow duration-300 cursor-pointer`}
            >
              <div className="flex items-center gap-4">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-14 h-14 object-contain rounded-lg"
                />
                <div>
                  <h3 className="text-base font-semibold text-gray-900">
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {category.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Categories;
    
