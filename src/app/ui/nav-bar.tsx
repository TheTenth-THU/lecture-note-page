"use client"; // This must be a client component to use hooks (useState, useEffect)

import { useState, useEffect } from "react";
import React from "react";
import Image from "next/image";

// Define the navigation links
import NavLinks from "./nav-links";
import { runYuanSerif, stoneSerif } from "./fonts";
import clsx from "clsx";
import InlineLink from "./inline-link";

export function Header() {
  // State to track if the header should be shrunk
  const [isShrunk, setIsShrunk] = useState(false);

  // Effect to add and remove the scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsShrunk(true);
      } else {
        setIsShrunk(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    // Cleanup function to remove the event listener
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 flex items-start justify-between px-10 md:px-20 bg-linear-to-r from-35% from-[#660974] dark:from-[#4f075a] to-[#C83272] dark:to-[#a8054c] text-white transition-all duration-300 ease-in-out ${
        isShrunk ? "h-32" : "h-56"
      }`}>
      <div
        className={`pt-5 transition-all duration-300 ease-in-out ${
          isShrunk ? "pt-6" : "pt-8"
        }`}>
        {/* Navigation Links */}
        <div
          className={`flex flex-row w-min justify-between transition-all duration-300 ease-in-out ${
            isShrunk ? "mb-2" : "mb-5"
          }`}>
          <NavLinks isShrunk={isShrunk} />
        </div>
        
        {/* Title and Affiliation */}
        <h1
          className={`mt-2 mb-1 font-bold transition-all duration-300 ease-in-out ${
            isShrunk ? "text-2xl" : "text-4xl"
          }`}>
          Lecture Notes <span className={`${runYuanSerif.className} ${isShrunk ? "text-2xl" : "text-3xl"}`}>课程笔记</span>
        </h1>
        <p className={clsx("text-base transition-opacity", isShrunk ? "opacity-0" : "opacity-100")}>
          {/* CHEN Zhen-Xing <span className={runYuanSerif.className}>陈禛兴</span>
          <br /> */}
          Department of Electronic Engineering
          <br />
          Tsinghua University
        </p>
      </div>

      {/* Logo */}
      <div
        className={`relative transition-all duration-300 ease-in-out hidden lg:block ${
          isShrunk ? "h-28 w-20" : "h-52 w-42"
        }`}>
        <Image
          src="/assets/logo.png"
          alt="Logo"
          width={150}
          height={200}
          className="absolute mt-4 h-full w-full object-cover object-top"
          onError={(e) => {
            e.currentTarget.src =
              "https://placehold.co/180x220/ffffff/153F51?text=Logo";
          }}
        />
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="bg-gray-100 dark:bg-gray-800 px-10 md:px-20 py-12">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-4 text-3xl font-bold">Contact</h2>
        <p className="mb-2">
          You can reach me via email:{" "}
          <InlineLink
            href="mailto:zhenxing23@mails.tsinghua.edu.cn">
            zhenxing23@mails.tsinghua.edu.cn
          </InlineLink>
          .
        </p>
        <p>
          For my time schedule and availability, please check my{" "}
          <InlineLink
            href="https://view-my-class-schedule.pages.dev/schedule"
            target="_blank"
            rel="noopener noreferrer">
            class schedule
          </InlineLink>
          .
        </p>
      </div>
    </footer>
  );
}
