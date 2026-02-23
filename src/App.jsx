import React, { useState, useEffect } from 'react';
import { SunIcon, MoonStarsIcon } from "@phosphor-icons/react";
import ramadan from './data';

const App = () => {
  // 1. Add state for our countdown timer and the next event
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [nextEvent, setNextEvent] = useState(""); // "Iftar" or "Sehri"

  function timeToMinutes(timeStr) {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);

    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  // Helper function to turn "05:12 AM" into a real Date object for accurate countdowns
  function parseTimeToDate(timeStr, offsetDays = 0) {
    const [time, modifier] = timeStr.split(" ");
    let [hours, minutes] = time.split(":").map(Number);
    if (modifier === "PM" && hours !== 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;

    const date = new Date();
    date.setDate(date.getDate() + offsetDays); // Add days if counting down to tomorrow
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  function getFastingProgress(sehriEnd, iftarTime) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const sehriMinutes = timeToMinutes(sehriEnd);
    const iftarMinutes = timeToMinutes(iftarTime);

    if (currentMinutes <= sehriMinutes) return 0;
    if (currentMinutes >= iftarMinutes) return 100;

    const totalFasting = iftarMinutes - sehriMinutes;
    const passed = currentMinutes - sehriMinutes;

    return ((passed / totalFasting) * 100).toFixed(2);
  }

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
  
  const currentRamadanDay = ramadan.find(date => date.date === today);

  // 2. The countdown logic
  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!currentRamadanDay) return;

      const now = new Date();
      const sehriTime = parseTimeToDate(currentRamadanDay.sehri_end_time);
      const iftarTime = parseTimeToDate(currentRamadanDay.iftar_time);

      let targetTime;
      let eventLabel;

      if (now < sehriTime) {
        // Before Sehri -> Count down to today's Sehri
        targetTime = sehriTime;
        eventLabel = "Sehri";
      } else if (now < iftarTime) {
        // After Sehri, Before Iftar -> Count down to today's Iftar
        targetTime = iftarTime;
        eventLabel = "Iftar";
      } else {
        // After Iftar -> Count down to tomorrow's Sehri
        const tomorrowDate = new Date(now);
        tomorrowDate.setDate(tomorrowDate.getDate() + 1);
        const tomorrowStr = tomorrowDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
        const tomorrowDay = ramadan.find(d => d.date === tomorrowStr);

        if (tomorrowDay) {
          targetTime = parseTimeToDate(tomorrowDay.sehri_end_time, 1);
          eventLabel = "Sehri";
        } else {
          setNextEvent("Ramadan Ended");
          return;
        }
      }

      const diff = targetTime - now;

      if (diff > 0) {
        setTimeLeft({
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((diff / 1000 / 60) % 60),
          seconds: Math.floor((diff / 1000) % 60)
        });
        setNextEvent(eventLabel);
      }
    };

    calculateTimeLeft(); // Call once immediately
    const timer = setInterval(calculateTimeLeft, 1000); // Update every second

    return () => clearInterval(timer); // Cleanup on unmount
  }, [currentRamadanDay]);

  // Safety check: if today is not in the JSON yet/anymore
  if (!currentRamadanDay) {
    return <div className="text-center mt-10 text-xl font-bold">No Ramadan data for today ({today}).</div>;
  }

  const progress = getFastingProgress(currentRamadanDay.sehri_end_time, currentRamadanDay.iftar_time);

  // Formatting helpers for adding leading zeros (e.g. '04' instead of '4')
  const formatTime = (time) => time < 10 ? `0${time}` : time;

  return (
    <main>
      <section className="container mx-auto">
        <h1 className="text-center font-bold text-2xl text-sm-md text-primary mb-6">Ramadan Mubarak</h1>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="block-content">
            <h2 className="text-center font-bold text-lg text-sm-md text-secondary">
              <SunIcon size={24} className="text-primary inline-block mr-2" />
              Todays Sehri Time
            </h2>
            <p className="text-center font-bold text-lg text-sm-md text-primary">{currentRamadanDay.sehri_end_time}</p>
          </div>
          <div className="block-content">
            <h2 className="text-center font-bold text-lg text-sm-md text-secondary">
              <MoonStarsIcon size={24} className="text-primary inline-block mr-2" />
              Todays Iftar Time
            </h2>
            <p className="text-center font-bold text-lg text-sm-md text-primary">{currentRamadanDay.iftar_time}</p>
          </div>
        </div>

        <div className="block-content">
          {/* 3. Updated Countdown UI */}
          <h2 className="text-center font-bold text-2xl sm:text-lg text-sm-md text-secondary">
            Time Remaining to {nextEvent}
          </h2>
          <div className="flex justify-center items-baseline gap-2 mt-4 mb-4">
            <div className="time-block text-center">
              <h4 className="tile-block-value text-primary font-bold text-3xl">{formatTime(timeLeft.hours)}</h4>
              <p className="tile-block-label text-sm">Hours</p>
            </div>
            <div className="text-2xl font-bold pb-4 text-[#00acb54d]">:</div>
            <div className="time-block text-center">
              <h4 className="tile-block-value text-primary font-bold text-3xl">{formatTime(timeLeft.minutes)}</h4>
              <p className="tile-block-label text-sm">Minutes</p>
            </div>
            <div className="text-2xl font-bold pb-4 text-[#00acb54d]">:</div>
            <div className="time-block text-center">
              <h4 className="tile-block-value text-primary font-bold text-3xl">{formatTime(timeLeft.seconds)}</h4>
              <p className="tile-block-label text-sm">Seconds</p>
            </div>
          </div>

          <div className="progress-wrapper">
            <div className="flex justify-between mb-2">
              <div className="flex items-center gap-2 text-xl text-secondary">
                <SunIcon size={24} className="text-primary" /> 
                {currentRamadanDay.sehri_end_time}
              </div>
              <div className="flex items-center gap-2 text-xl text-secondary">
                {currentRamadanDay.iftar_time}
                <MoonStarsIcon size={24} className="text-primary" />
              </div>
            </div>
            <div className="progress-bar bg-gray-200 h-4 rounded-2xl overflow-hidden">
              <div className='progress bg-[#00ADB5] h-4 rounded-2xl transition-all duration-1000' style={{ width: `${progress}%` }}></div>
            </div>
            <h4 className="text-center font-bold text-lg text-sm-md text-secondary mt-2">
              {progress > 0 && progress < 100 ? `${Math.floor(progress)}% Completed` : nextEvent === "Iftar" ? "Fasting in Progress" : "Waiting for Fast"}
            </h4>
          </div>
        </div>
      </section>

      <section className="container mx-auto mt-8 bg-gray-100 p-4">
        <table className="w-full text-center">
          <thead>
            <tr className="">
              <th className="">Ramadan</th>
              <th className="">Date</th>
              <th className="">Sehri Time</th>
              <th className="">Iftar Time</th>
            </tr>
          </thead>
          <tbody>
            {ramadan.map((date, index) => (
              <tr key={index} className={` ${date.date === today ? 'active border-r-2' : ''}`}>
                <td className="">{date.ramadan_day}</td>
                <td className="">{date.date} <br /> 
                  {date.day}</td>
                <td className="">{date.sehri_end_time}</td>
                <td className="">{date.iftar_time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
};

export default App;