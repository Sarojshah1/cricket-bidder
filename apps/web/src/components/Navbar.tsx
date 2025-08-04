'use client';

import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Button, Avatar, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from '@nextui-org/react';
import { Cricket, User } from 'lucide-react';

export default function AppNavbar() {
  return (
    <Navbar isBordered>
      <NavbarBrand>
        <Cricket className="w-8 h-8 text-primary" />
        <p className="font-bold text-inherit ml-2">Cricket Bidder</p>
      </NavbarBrand>

      <NavbarContent className="hidden sm:flex gap-4" justify="center">
        <NavbarItem>
          <Button variant="light" href="/">
            Home
          </Button>
        </NavbarItem>
        <NavbarItem>
          <Button variant="light" href="/auctions">
            Auctions
          </Button>
        </NavbarItem>
        <NavbarItem>
          <Button variant="light" href="/players">
            Players
          </Button>
        </NavbarItem>
        <NavbarItem>
          <Button variant="light" href="/teams">
            Teams
          </Button>
        </NavbarItem>
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <Button color="primary" href="/login" variant="flat">
            Login
          </Button>
        </NavbarItem>
        <NavbarItem>
          <Button color="primary" href="/register">
            Sign Up
          </Button>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
} 