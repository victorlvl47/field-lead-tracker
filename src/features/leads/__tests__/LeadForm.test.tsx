import { fireEvent, render } from "@testing-library/react-native";
import { describe, expect, it, vi } from "vitest";

import { LeadForm } from "../LeadForm";

describe("LeadForm", () => {
  it("submits the entered lead name with the default values", async () => {
    const onSubmit = vi.fn();

    const screen = await render(
      <LeadForm submitLabel="Save Lead" onSubmit={onSubmit} />,
    );

    await fireEvent.changeText(
      screen.getByPlaceholderText("Lead name"),
      "Acme Lead",
    );
    await fireEvent.press(screen.getByText("Save Lead"));

    expect(onSubmit).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledWith({
      name: "Acme Lead",
      company: "",
      phone: "",
      email: "",
      status: "new",
      notes: "",
    });
  });
});
