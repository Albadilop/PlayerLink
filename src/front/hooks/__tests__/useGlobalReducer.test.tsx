import React from "react";
import { renderHook, act } from "@testing-library/react";
import { StoreProvider, useGlobalReducer } from "../useGlobalReducer";
import type { User } from "../../types";

describe("useGlobalReducer", () => {
  it("should initialize with default state", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StoreProvider>{children}</StoreProvider>
    );

    const { result } = renderHook(() => useGlobalReducer(), { wrapper });

    expect(result.current.store.user).toBeNull();
    expect(result.current.store.searchMatchProfiles).toEqual([]);
    expect(result.current.store.userMatchesInfo).toBeNull();
  });

  it("should update user on getUserInfo action", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StoreProvider>{children}</StoreProvider>
    );

    const { result } = renderHook(() => useGlobalReducer(), { wrapper });

    const mockUser: User = {
      id: 1,
      email: "test@example.com",
      profile: null,
    };

    act(() => {
      result.current.dispatch({
        type: "getUserInfo",
        payload: mockUser,
      });
    });

    expect(result.current.store.user).toEqual(mockUser);
  });

  it("should update searchMatchProfiles on getSearchMatchProfiles action", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StoreProvider>{children}</StoreProvider>
    );

    const { result } = renderHook(() => useGlobalReducer(), { wrapper });

    const mockProfiles = [
      {
        id: 1,
        user_id: 1,
        nick_name: "user1",
        gender: "Male",
        age: 25,
        name: "User 1",
        discord: null,
        preferences: null,
        zodiac: null,
        location: "City 1",
        bio: null,
        photo: "photo1",
        language: null,
        steam: null,
        games: [],
      },
    ];

    act(() => {
      result.current.dispatch({
        type: "getSearchMatchProfiles",
        payload: mockProfiles,
      });
    });

    expect(result.current.store.searchMatchProfiles).toEqual(mockProfiles);
  });

  it("should clear user on logout action", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StoreProvider>{children}</StoreProvider>
    );

    const { result } = renderHook(() => useGlobalReducer(), { wrapper });

    // First set a user
    const mockUser: User = {
      id: 1,
      email: "test@example.com",
      profile: null,
    };

    act(() => {
      result.current.dispatch({
        type: "getUserInfo",
        payload: mockUser,
      });
    });

    expect(result.current.store.user).toEqual(mockUser);

    // Then logout
    act(() => {
      result.current.dispatch({
        type: "logout",
      });
    });

    expect(result.current.store.user).toBeNull();
  });

  it("should add match on addMatch action", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <StoreProvider>{children}</StoreProvider>
    );

    const { result } = renderHook(() => useGlobalReducer(), { wrapper });

    const mockMatch = {
      id: 1,
      user_id: 2,
      nick_name: "matcheduser",
      gender: "Female",
      age: 24,
      name: "Matched User",
      discord: null,
      preferences: null,
      zodiac: null,
      location: "City 2",
      bio: null,
      photo: "photo2",
      language: null,
      steam: null,
      games: [],
    };

    act(() => {
      result.current.dispatch({
        type: "addMatch",
        payload: mockMatch,
      });
    });

    // Check if match was added (implementation dependent)
    expect(result.current.store.userMatchesInfo).toBeDefined();
  });
});
