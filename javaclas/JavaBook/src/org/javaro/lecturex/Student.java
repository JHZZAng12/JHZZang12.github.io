package org.javaro.lecturex;

public class Student {
	private String name;
	private String studNumber;
	private int maxBooks;
	public Student() {
	}
	public Student(String studNumber) {this.studNumber =studNumber;}
	public String getName() {
		return this.name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getStudNumber() {
		return this.studNumber;
	}
	public int getMaxBooks() {
		return maxBooks;
	}
	public void setMaxBooks(int maxBooks) {
		this.maxBooks =maxBooks;
	}
	public void setStudNumber(String studNumber) {
		this.studNumber = studNumber;
	}
	public String toString() {
		return "학번=" +this.getStudNumber()+",학생이름="+this.getName()+"(최대" +this.maxBooks+"권)";
	}
	

}
